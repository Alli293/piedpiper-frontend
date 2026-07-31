import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
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
import { PROVINCIA_OPTIONS } from '../models/preferencias-viaje.model';
import { EcoRutaItinerariosService } from './ecoruta-itinerarios.service';
import { Itinerario, ItinerarioActividad, ItinerarioDia } from './models/itinerario.model';
import { RefinamientoChatComponent } from './refinamiento-chat/refinamiento-chat.component';
import { derivarEtiquetaRuta } from './utils/ruta-diaria.utils';

interface BandaEcoScore {
  texto: string;
  variant: BadgeVariant;
}

const ERROR_CARGA = 'No se pudo cargar el itinerario. Intenta nuevamente.';

@Component({
  selector: 'app-itinerario-generado-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    DatePipe,
    HeadingComponent,
    IconComponent,
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
    return { texto: 'Reprobable', variant: 'danger' };
  });

  protected readonly donutDasharray = computed(() => {
    const score = this.itinerario()?.puntuacionAmbientalPreliminar;
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

    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const itinerario = await firstValueFrom(this.itinerariosService.obtener(id));
      this.itinerario.set(this.ordenar(itinerario));
    } catch (err: unknown) {
      this.errorCarga.set(true);
      this.toastService.error(this.mensajeError(err));
    } finally {
      this.cargando.set(false);
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

  private mensajeError(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      return apiErrorMessage(err) ?? 'No encontramos este itinerario.';
    }
    return apiErrorMessage(err) ?? ERROR_CARGA;
  }
}
