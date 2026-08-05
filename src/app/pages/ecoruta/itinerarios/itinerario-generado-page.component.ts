import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../../core/auth-session.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { formatCurrency } from '../../../shared/utils/currency.utils';
import { PROVINCIA_OPTIONS } from '../models/preferencias-viaje.model';
import { CertificacionesDetalleComponent } from './certificaciones-detalle/certificaciones-detalle.component';
import { EcoRutaItinerariosService } from './ecoruta-itinerarios.service';
import { Itinerario, ItinerarioActividad, ItinerarioDia } from './models/itinerario.model';
import { PuntuacionAmbientalBadgeComponent } from './puntuacion-ambiental-badge/puntuacion-ambiental-badge.component';
import { RefinamientoChatComponent } from './refinamiento-chat/refinamiento-chat.component';
import { derivarEtiquetaRuta } from './utils/ruta-diaria.utils';

interface BandaEcoScore {
  texto: string;
  variant: BadgeVariant;
}

const ERROR_CARGA = 'No se pudo cargar el itinerario. Intenta nuevamente.';
const ERROR_ACCESO_DENEGADO = 'No tienes permiso para acceder a este itinerario.';
const TOAST_DURATION_MS = 5000;

@Component({
  selector: 'app-itinerario-generado-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CertificacionesDetalleComponent,
    DatePipe,
    HeadingComponent,
    IconComponent,
    PuntuacionAmbientalBadgeComponent,
    RefinamientoChatComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './itinerario-generado-page.component.html',
  styleUrl: './itinerario-generado-page.component.scss',
})
export class ItinerarioGeneradoPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly itinerariosService = inject(EcoRutaItinerariosService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly itinerario = signal<Itinerario | null>(null);
  protected readonly diasExpandidos = signal<Set<number>>(new Set());

  private readonly chatPanel = viewChild<ElementRef<HTMLElement>>('chatPanel');

  private cargaRequestId = 0;

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'ECORUTA / ITINERARIO',
    pageTitle: this.itinerario()
      ? `Itinerario · ${this.itinerario()!.cantidadDias} días`
      : 'Itinerario generado',
    showNotificationDot: false,
    userInitials: this.authSession.getUserInitials(),
  }));

  protected readonly bandaEcoScore = computed<BandaEcoScore | null>(() => {
    const score = this.itinerario()?.puntuacionAmbientalPreliminar;
    if (score === null || score === undefined) return null;
    if (score >= 80) return { texto: 'Excelente', variant: 'success' };
    if (score >= 60) return { texto: 'Buena', variant: 'info' };
    if (score >= 40) return { texto: 'Moderada', variant: 'warning' };
    return { texto: 'Mejorable', variant: 'danger' };
  });

  protected readonly donutDasharray = computed(() => {
    const score = this.itinerario()?.puntuacionAmbientalPreliminar;
    const circumference = 2 * Math.PI * 54;
    if (score === null || score === undefined) return `0, ${circumference}`;
    return `${(score / 100) * circumference}, ${circumference}`;
  });

  protected readonly esVersionVigente = computed(() => true);

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
    return PROVINCIA_OPTIONS.find((option) => option.value === codigo)?.label ?? codigo;
  }

  protected volverAMisItinerarios(): void {
    void this.router.navigateByUrl('/ecoruta/itinerarios');
  }

  protected toggleDia(numeroDia: number): void {
    this.diasExpandidos.update((actual) => {
      const siguiente = new Set(actual);
      siguiente.has(numeroDia) ? siguiente.delete(numeroDia) : siguiente.add(numeroDia);
      return siguiente;
    });
  }

  protected diaExpandido(numeroDia: number): boolean {
    return this.diasExpandidos().has(numeroDia);
  }

  protected formatearCosto(actividad: ItinerarioActividad): string {
    return formatCurrency(actividad.costoAproximado ?? 0, actividad.moneda ?? 'CRC');
  }

  protected preguntarSobreActividad(): void {
    this.chatPanel()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      return apiErrorMessage(err) ?? 'No encontramos este itinerario.';
    }
    return apiErrorMessage(err) ?? ERROR_CARGA;
  }
}
