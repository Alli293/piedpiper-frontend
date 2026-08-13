import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { EcoRutaRecomendacionesService } from '../ecoruta-recomendaciones.service';
import { Itinerario } from '../models/itinerario.model';
import { RecomendacionAmbiental } from '../models/recomendaciones.model';
import { crearSustitucionRequest } from '../utils/sustitucion.utils';

const ERROR_ACCESO_DENEGADO = 'No tienes permiso para acceder a este itinerario.';
const ERROR_GENERAR = 'No fue posible generar recomendaciones ambientales.';
const ERROR_APLICAR = 'No fue posible aplicar la recomendación. Intenta nuevamente.';
const ERROR_DATOS_INCOMPLETOS =
  'Esta recomendación no tiene los datos necesarios para aplicarse. Probá recargar la página.';
const MENSAJE_SIN_RECOMENDACIONES_FALLBACK = 'No hay recomendaciones para mostrar por ahora.';
const TOAST_DURATION_MS = 5000;

@Component({
  selector: 'app-recomendaciones-ambientales',
  imports: [DecimalPipe, IconComponent],
  templateUrl: './recomendaciones-ambientales.component.html',
  styleUrl: './recomendaciones-ambientales.component.scss',
})
export class RecomendacionesAmbientalesComponent {
  itinerarioId = input.required<string>();
  itinerarioActualizado = output<Itinerario>();

  private readonly recomendacionesService = inject(EcoRutaRecomendacionesService);
  private readonly toastService = inject(ToastService);

  // Incrementado en cada cargar(): si itinerarioId cambia mientras una petición sigue en vuelo,
  // la respuesta vieja se descarta en vez de sobrescribir las recomendaciones del itinerario nuevo.
  private ultimoPedido = 0;

  protected readonly cargando = signal(true);
  protected readonly recomendaciones = signal<RecomendacionAmbiental[]>([]);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly errorCarga = signal<string | null>(null);
  // Set de actividadIds con una aplicación en vuelo — no un solo id global, para que aplicar dos
  // recomendaciones distintas en paralelo no pise el estado de "aplicando" de una con la otra.
  protected readonly actividadesAplicando = signal<ReadonlySet<string>>(new Set());

  protected readonly itinerarioOptimizado = computed(
    () => !this.cargando() && !this.errorCarga() && this.recomendaciones().length === 0
  );

  protected readonly mensajeMostrado = computed(
    () => this.mensaje() ?? MENSAJE_SIN_RECOMENDACIONES_FALLBACK
  );

  constructor() {
    effect(() => {
      const id = this.itinerarioId();
      void this.cargar(id);
    });
  }

  protected async cargar(itinerarioId: string): Promise<void> {
    const pedidoActual = ++this.ultimoPedido;
    this.cargando.set(true);
    this.mensaje.set(null);
    this.errorCarga.set(null);

    try {
      const response = await firstValueFrom(
        this.recomendacionesService.obtenerRecomendaciones(itinerarioId)
      );
      if (pedidoActual !== this.ultimoPedido) return; // respuesta obsoleta, se descarta

      this.recomendaciones.set(response.recomendaciones);
      this.mensaje.set(response.mensaje);
    } catch (err: unknown) {
      if (pedidoActual !== this.ultimoPedido) return;

      this.recomendaciones.set([]);
      this.mensaje.set(null);
      const mensajeError = this.mensajeDeError(err, ERROR_GENERAR);
      this.errorCarga.set(mensajeError);
      this.toastService.error(mensajeError, undefined, TOAST_DURATION_MS);
    } finally {
      if (pedidoActual === this.ultimoPedido) {
        this.cargando.set(false);
      }
    }
  }

  /** Misma condición que exige el backend en ComparacionAlternativasService.sustituirActividad
   *  (PP-92) para poder aplicar la sustitución: sin estos 4 campos la recomendación nunca puede
   *  aplicarse, así que ni el botón debería mostrarse. */
  protected puedeAplicar(recomendacion: RecomendacionAmbiental): boolean {
    return (
      !!recomendacion.actividadId &&
      !!recomendacion.alternativa &&
      !!recomendacion.categoriaTuristica &&
      !!recomendacion.provincia
    );
  }

  protected aplicar(recomendacion: RecomendacionAmbiental): void {
    if (!this.puedeAplicar(recomendacion)) {
      // No debería ser alcanzable si el template usa puedeAplicar() para el @if del botón, pero
      // se deja el toast como defensa en profundidad en vez de un return silencioso.
      this.toastService.error(ERROR_DATOS_INCOMPLETOS, undefined, TOAST_DURATION_MS);
      return;
    }

    const itinerarioId = this.itinerarioId();
    const actividadId = recomendacion.actividadId!;
    const body = crearSustitucionRequest(
      recomendacion.alternativa!,
      recomendacion.categoriaTuristica!,
      recomendacion.provincia!
    );

    this.marcarAplicando(actividadId, true);

    this.recomendacionesService.aplicarRecomendacion(itinerarioId, actividadId, body).subscribe({
      next: (itinerarioActualizado) => {
        this.marcarAplicando(actividadId, false);
        this.recomendaciones.update((actual) =>
          actual.filter((r) => r.actividadId !== actividadId)
        );
        this.itinerarioActualizado.emit(itinerarioActualizado);
        this.toastService.success(
          'Recomendación aplicada exitosamente.',
          undefined,
          TOAST_DURATION_MS
        );
      },
      error: (err: unknown) => {
        this.marcarAplicando(actividadId, false);
        this.toastService.error(
          this.mensajeDeError(err, ERROR_APLICAR),
          undefined,
          TOAST_DURATION_MS
        );
      },
    });
  }

  protected aplicando(recomendacion: RecomendacionAmbiental): boolean {
    return (
      !!recomendacion.actividadId && this.actividadesAplicando().has(recomendacion.actividadId)
    );
  }

  private marcarAplicando(actividadId: string, enCurso: boolean): void {
    this.actividadesAplicando.update((actual) => {
      const siguiente = new Set(actual);
      if (enCurso) {
        siguiente.add(actividadId);
      } else {
        siguiente.delete(actividadId);
      }
      return siguiente;
    });
  }

  private mensajeDeError(err: unknown, fallback: string): string {
    return err instanceof HttpErrorResponse && err.status === 403
      ? ERROR_ACCESO_DENEGADO
      : fallback;
  }
}
