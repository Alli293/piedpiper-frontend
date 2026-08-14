import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../../core/auth-session.service';
import { InsigniaEcoRuta } from '../../../core/models/insignia-ecoruta.model';
import { InsigniasEcoRutaService } from '../../../core/services/insignias-ecoruta.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';

interface InsigniaCatalogo {
  readonly idInsignia: number;
  readonly nombre: string;
  readonly descripcion: string;
  readonly eventoDesbloqueo: string;
  readonly icono: IconName;
}

const CATALOGO_INSIGNIAS: readonly InsigniaCatalogo[] = [
  {
    idInsignia: 1,
    nombre: 'Primer itinerario',
    descripcion: 'Creaste tu primer itinerario sostenible con EcoRuta.',
    eventoDesbloqueo: 'primer_itinerario_generado',
    icono: 'viajero',
  },
  {
    idInsignia: 2,
    nombre: 'EcoScore Excelente',
    descripcion: 'Completaste tu primer itinerario sostenible.',
    eventoDesbloqueo: 'primer_itinerario_sostenible',
    icono: 'success',
  },
  {
    idInsignia: 3,
    nombre: 'Exploradora local',
    descripcion: 'Planificaste 5 itinerarios de bajo impacto.',
    eventoDesbloqueo: 'cinco_itinerarios_generados',
    icono: 'perfil-publico',
  },
  {
    idInsignia: 4,
    nombre: 'Usuario recurrente',
    descripcion: 'Volviste a planificar rutas sostenibles con EcoRuta.',
    eventoDesbloqueo: 'usuario_recurrente',
    icono: 'emisiones',
  },
  {
    idInsignia: 5,
    nombre: '10 itinerarios',
    descripcion: 'Planificaste 10 itinerarios de bajo impacto.',
    eventoDesbloqueo: 'diez_itinerarios_generados',
    icono: 'insignias',
  },
  {
    idInsignia: 6,
    nombre: 'Explorador de provincias',
    descripcion: 'Incluiste varias provincias en tus itinerarios de bajo impacto.',
    eventoDesbloqueo: 'explorador_de_provincias',
    icono: 'home',
  },
];

const ERROR_CARGA = 'No se pudieron cargar tus insignias. Intenta nuevamente.';
const ORDEN_PROXIMAS = [5, 6, 4, 2];

@Component({
  selector: 'app-insignias-ecoruta-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    DatePipe,
    HeadingComponent,
    IconComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './insignias-ecoruta-page.component.html',
  styleUrl: './insignias-ecoruta-page.component.scss',
})
export class InsigniasEcoRutaPageComponent {
  private readonly insigniasService = inject(InsigniasEcoRutaService);
  private readonly toastService = inject(ToastService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly insignias = signal<InsigniaEcoRuta[]>([]);
  protected readonly idSeleccionada = signal<number | null>(null);

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'ECORUTA / INSIGNIAS',
    pageTitle: 'Mis insignias',
    userInitials: this.authSession.getUserInitials(),
  }));

  protected readonly insigniasOrdenadas = computed(() =>
    [...this.insignias()].sort(
      (a, b) => new Date(b.fechaObtencion).getTime() - new Date(a.fechaObtencion).getTime()
    )
  );

  protected readonly insigniaSeleccionada = computed(() => {
    const insignias = this.insigniasOrdenadas();
    return (
      insignias.find((insignia) => insignia.idInsignia === this.idSeleccionada()) ??
      insignias[0] ??
      null
    );
  });

  protected readonly proximasInsignias = computed(() => {
    const obtenidas = new Set(this.insignias().map((insignia) => insignia.idInsignia));
    return CATALOGO_INSIGNIAS.filter((insignia) => !obtenidas.has(insignia.idInsignia)).sort(
      (a, b) => ORDEN_PROXIMAS.indexOf(a.idInsignia) - ORDEN_PROXIMAS.indexOf(b.idInsignia)
    );
  });

  constructor() {
    void this.cargarInsignias();
  }

  protected async cargarInsignias(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const insignias = await firstValueFrom(this.insigniasService.listarObtenidas());
      this.insignias.set(insignias);
      this.idSeleccionada.set(this.insigniasOrdenadas()[0]?.idInsignia ?? null);
    } catch (err: unknown) {
      this.insignias.set([]);
      this.idSeleccionada.set(null);
      this.errorCarga.set(true);
      this.toastService.error(this.mensajeError(err));
    } finally {
      this.cargando.set(false);
    }
  }

  protected seleccionar(insignia: InsigniaEcoRuta): void {
    this.idSeleccionada.set(insignia.idInsignia);
  }

  protected iconoInsignia(idInsignia: number): IconName {
    return (
      CATALOGO_INSIGNIAS.find((insignia) => insignia.idInsignia === idInsignia)?.icono ??
      'insignias'
    );
  }

  protected planificarItinerario(): void {
    void this.router.navigateByUrl('/ecoruta/preferencias');
  }

  private mensajeError(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 403) {
      return apiErrorMessage(err) ?? 'No tenés permiso para ver estas insignias.';
    }
    if (err instanceof HttpErrorResponse && err.status === 404) {
      return apiErrorMessage(err) ?? 'No encontramos tus insignias de EcoRuta.';
    }
    return apiErrorMessage(err) ?? ERROR_CARGA;
  }
}
