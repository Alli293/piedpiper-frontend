import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../../core/auth-session.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { formatCurrency } from '../../../shared/utils/currency.utils';
import { CertificacionesDetalleComponent } from './certificaciones-detalle/certificaciones-detalle.component';
import { EcoRutaItinerariosService } from './ecoruta-itinerarios.service';
import { EstablecimientosEvaluadosComponent } from './establecimientos-evaluados/establecimientos-evaluados.component';
import { Itinerario, ItinerarioActividad, ItinerarioDia } from './models/itinerario.model';
import { PuntuacionAmbientalBadgeComponent } from './puntuacion-ambiental-badge/puntuacion-ambiental-badge.component';
import { RecomendacionesAmbientalesComponent } from './recomendaciones-ambientales/recomendaciones-ambientales.component';
import { RefinamientoChatComponent } from './refinamiento-chat/refinamiento-chat.component';
import { ClasificacionInfo, INFO_POR_CLASIFICACION } from './utils/clasificacion-ambiental.utils';
import { etiquetaProvincia } from './utils/provincia.utils';
import { derivarEtiquetaRuta } from './utils/ruta-diaria.utils';

interface EscalaEcoScoreItem {
  clave: string;
  rango: string;
  texto: string;
}

const ERROR_CARGA = 'No se pudo cargar el itinerario. Intenta nuevamente.';
const ERROR_ACCESO_DENEGADO = 'No tienes permiso para acceder a este itinerario.';
const ECOSCORE_NO_DISPONIBLE = 'No fue posible calcular el impacto ambiental del itinerario.';
const TOAST_DURATION_MS = 5000;

@Component({
  selector: 'app-itinerario-generado-page',
  imports: [
    ButtonComponent,
    CertificacionesDetalleComponent,
    DatePipe,
    EstablecimientosEvaluadosComponent,
    IconComponent,
    PuntuacionAmbientalBadgeComponent,
    RecomendacionesAmbientalesComponent,
    RefinamientoChatComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './itinerario-generado-page.component.html',
  styleUrl: './itinerario-generado-page.component.scss',
})
export class ItinerarioGeneradoPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly itinerariosService = inject(EcoRutaItinerariosService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly itinerario = signal<Itinerario | null>(null);
  protected readonly diasExpandidos = signal<Set<number>>(new Set());

  private readonly chatPanel = viewChild<ElementRef<HTMLElement>>('chatPanel');
  private readonly refinamientoChat = viewChild(RefinamientoChatComponent);

  private cargaRequestId = 0;

  protected readonly escalaEcoScore: readonly EscalaEcoScoreItem[] = [
    { clave: 'EXCELENTE', rango: '80–100', texto: 'Excelente' },
    { clave: 'BUENA', rango: '60–79', texto: 'Buena' },
    { clave: 'MODERADA', rango: '40–59', texto: 'Moderada' },
    { clave: 'MEJORABLE', rango: '0–39', texto: 'Mejorable' },
  ];

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'ECORUTA / ITINERARIO',
    pageTitle: this.itinerario()
      ? `Costa Rica sostenible · ${this.itinerario()!.cantidadDias} días`
      : 'Itinerario generado',
    userInitials: this.authSession.getUserInitials(),
    showBackButton: true,
  }));

  protected readonly bandaEcoScore = computed<ClasificacionInfo | null>(() => {
    const clasificacion = this.itinerario()?.clasificacionAmbiental;
    if (!clasificacion) return null;
    return INFO_POR_CLASIFICACION[clasificacion] ?? null;
  });

  // El backend puede omitir este campo (queda null) cuando no hay establecimientos que evaluar;
  // se normaliza acá para que la plantilla nunca reciba null en un campo tipado como arreglo.
  protected readonly establecimientosEvaluados = computed(
    () => this.itinerario()?.establecimientosEvaluados ?? []
  );

  protected readonly donutDasharray = computed(() => {
    const score = this.itinerario()?.ecoScore;
    const circumference = 2 * Math.PI * 54;
    if (score === null || score === undefined) return `0, ${circumference}`;
    return `${(score / 100) * circumference}, ${circumference}`;
  });

  constructor() {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorCarga.set(true);
      this.cargando.set(false);
      return;
    }

    const requestId = ++this.cargaRequestId;
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const itinerario = await firstValueFrom(this.itinerariosService.obtener(id));
      if (requestId !== this.cargaRequestId) return;
      const ordenado = this.ordenar(itinerario);
      this.itinerario.set(ordenado);
      this.diasExpandidos.set(new Set(ordenado.dias.map((dia) => dia.numeroDia)));
      if (itinerario.ecoScore === null) {
        this.toastService.error(ECOSCORE_NO_DISPONIBLE, undefined, TOAST_DURATION_MS);
      }
    } catch (err: unknown) {
      if (requestId !== this.cargaRequestId) return;
      this.errorCarga.set(true);
      this.mostrarToastError(err);
    } finally {
      if (requestId === this.cargaRequestId) {
        this.cargando.set(false);
      }
    }
  }

  protected etiquetaRuta(dia: ItinerarioDia): string {
    return derivarEtiquetaRuta(dia.actividades);
  }

  protected etiquetaProvincia(codigo: string): string {
    return etiquetaProvincia(codigo);
  }

  protected toggleDia(numeroDia: number): void {
    this.diasExpandidos.update((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(numeroDia)) {
        siguiente.delete(numeroDia);
      } else {
        siguiente.add(numeroDia);
      }
      return siguiente;
    });
  }

  protected diaExpandido(numeroDia: number): boolean {
    return this.diasExpandidos().has(numeroDia);
  }

  /**
   * `costoAproximado` nunca es null acá: el único call site en la plantilla ya filtra con
   * `@if (actividad.costoAproximado !== null)` antes de invocar este método.
   */
  protected formatearCosto(actividad: ItinerarioActividad): string {
    return formatCurrency(actividad.costoAproximado!, actividad.moneda);
  }

  protected preguntarSobreActividad(actividad: ItinerarioActividad): void {
    this.refinamientoChat()?.prellenarMensaje(`¿Qué opciones tengo para "${actividad.nombre}"?`);
    this.chatPanel()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * El chat de refinamiento (PP-88) emite el itinerario ya actualizado tras cada ajuste o
   * sustitución. Pasa por la misma normalización que la carga inicial (`ordenar()`) en vez de
   * asignarse directo — no hay garantía de que el backend devuelva días/actividades ya ordenados.
   */
  protected onItinerarioActualizado(itinerario: Itinerario): void {
    this.itinerario.set(this.ordenar(itinerario));
  }

  /**
   * Ordena defensivamente días y actividades — no se asume que el backend garantice el orden.
   */
  private ordenar(itinerario: Itinerario): Itinerario {
    const dias = [...itinerario.dias]
      .sort((a, b) => a.numeroDia - b.numeroDia)
      .map((dia) => ({
        ...dia,
        actividades: [...dia.actividades].sort((a: ItinerarioActividad, b: ItinerarioActividad) =>
          a.horario.localeCompare(b.horario)
        ),
      }));
    return { ...itinerario, dias };
  }

  private mostrarToastError(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 403) {
      this.toastService.error(ERROR_ACCESO_DENEGADO, undefined, TOAST_DURATION_MS);
    } else if (err instanceof HttpErrorResponse && err.status >= 500) {
      this.toastService.error(apiErrorMessage(err) ?? ERROR_CARGA, undefined, TOAST_DURATION_MS);
    } else {
      this.toastService.error(this.mensajeError(err));
    }
  }

  private mensajeError(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      return apiErrorMessage(err) ?? 'No fue posible encontrar el itinerario solicitado.';
    }
    return apiErrorMessage(err) ?? ERROR_CARGA;
  }
}
