import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { EcoRutaRecomendacionesService } from '../ecoruta-recomendaciones.service';
import { SustitucionRequest } from '../models/alternativas.model';
import { Itinerario } from '../models/itinerario.model';
import { RecomendacionAmbiental } from '../models/recomendaciones.model';

const ERROR_ACCESO_DENEGADO = 'No tienes permiso para acceder a este itinerario.';
const ERROR_GENERAR = 'No fue posible generar recomendaciones ambientales.';
const ERROR_APLICAR = 'No fue posible aplicar la recomendación. Intenta nuevamente.';
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

  protected readonly cargando = signal(true);
  protected readonly recomendaciones = signal<RecomendacionAmbiental[]>([]);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly actividadAplicandoId = signal<string | null>(null);

  protected readonly itinerarioOptimizado = computed(
    () => !this.cargando() && this.recomendaciones().length === 0 && this.mensaje() !== null
  );

  constructor() {
    effect(() => {
      const id = this.itinerarioId();
      void this.cargar(id);
    });
  }

  protected async cargar(itinerarioId: string): Promise<void> {
    this.cargando.set(true);
    this.mensaje.set(null);

    try {
      const response = await firstValueFrom(
        this.recomendacionesService.obtenerRecomendaciones(itinerarioId)
      );
      this.recomendaciones.set(response.recomendaciones);
      this.mensaje.set(response.mensaje);
    } catch (err: unknown) {
      this.recomendaciones.set([]);
      this.mensaje.set(null);
      this.mostrarToastError(err, ERROR_GENERAR);
    } finally {
      this.cargando.set(false);
    }
  }

  protected aplicar(recomendacion: RecomendacionAmbiental): void {
    if (
      !recomendacion.actividadId ||
      !recomendacion.alternativa ||
      !recomendacion.categoriaTuristica ||
      !recomendacion.provincia
    ) {
      return;
    }

    const itinerarioId = this.itinerarioId();
    const actividadId = recomendacion.actividadId;
    const alternativa = recomendacion.alternativa;

    const body: SustitucionRequest = {
      nombre: alternativa.nombre,
      descripcion: alternativa.descripcion,
      costoAproximado: alternativa.costoAproximado,
      moneda: alternativa.moneda,
      establecimientoRecomendado: alternativa.establecimientoRecomendado,
      ecoScore: alternativa.ecoScore,
      categoriaTuristica: recomendacion.categoriaTuristica,
      provincia: recomendacion.provincia,
    };

    this.actividadAplicandoId.set(actividadId);

    this.recomendacionesService.aplicarRecomendacion(itinerarioId, actividadId, body).subscribe({
      next: (itinerarioActualizado) => {
        this.actividadAplicandoId.set(null);
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
        this.actividadAplicandoId.set(null);
        this.mostrarToastError(err, ERROR_APLICAR);
      },
    });
  }

  protected aplicando(recomendacion: RecomendacionAmbiental): boolean {
    return this.actividadAplicandoId() === recomendacion.actividadId;
  }

  private mostrarToastError(err: unknown, fallback: string): void {
    if (err instanceof HttpErrorResponse && err.status === 403) {
      this.toastService.error(ERROR_ACCESO_DENEGADO, undefined, TOAST_DURATION_MS);
    } else {
      this.toastService.error(fallback, undefined, TOAST_DURATION_MS);
    }
  }
}
