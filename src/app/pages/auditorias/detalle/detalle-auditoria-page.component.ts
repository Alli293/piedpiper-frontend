import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { EMPTY, Subject, Subscription, firstValueFrom, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { initialsFromNombreCompleto } from '../../../shared/utils/initials.utils';
import {
  DetalleSolicitudAuditoria,
  EstadoSolicitudAuditoria,
  INTERVALO_SONDEO_DETALLE_MS,
  PASOS_AUDITORIA,
} from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';

type SituacionPaso = 'completado' | 'en-curso' | 'pendiente';

interface PasoLineaTiempo {
  estado: EstadoSolicitudAuditoria;
  titulo: string;
  situacion: SituacionPaso;
  fecha: string | null;
  responsable: string | null;
}

const TITULOS_PASO: Record<EstadoSolicitudAuditoria, string> = {
  SOLICITUD_ENVIADA: 'Solicitud enviada',
  AUDITOR_ASIGNADO: 'Auditor asignado',
  EN_REVISION: 'En revisión',
  REPORTE_CARGADO: 'Reporte cargado',
  OBSERVACIONES_PENDIENTES: 'Observaciones pendientes',
  CERTIFICACION_EMITIDA: 'Certificación emitida',
};

const ERROR_SONDEO =
  'No se pudo actualizar en tiempo real. Recarga la página para ver el estado más reciente.';
const ERROR_NO_ENCONTRADA = 'Esta solicitud de auditoría no fue encontrada.';
const ERROR_SIN_PERMISO = 'No tienes permiso para ver esta solicitud de auditoría.';
const ERROR_CARGA = 'No se pudo cargar el detalle de la auditoría. Intenta nuevamente.';

@Component({
  selector: 'app-detalle-auditoria-page',
  imports: [
    AvatarComponent,
    BadgeComponent,
    DatePipe,
    HeadingComponent,
    IconComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './detalle-auditoria-page.component.html',
  styleUrl: './detalle-auditoria-page.component.scss',
})
export class DetalleAuditoriaPageComponent implements OnInit, OnDestroy {
  readonly idSolicitud = input.required<string>({ alias: 'id' });

  private readonly auditoriasService = inject(AuditoriasService);

  private readonly visibilidad = new Subject<boolean>();
  private suscripcionSondeo?: Subscription;

  protected readonly detalle = signal<DetalleSolicitudAuditoria | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorSondeo = signal<string | null>(null);

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'AUDITORÍAS',
    pageTitle: 'Detalle de Auditoría',
    showNotificationDot: true,
    showBackButton: true,
  };

  protected readonly nombreAuditor = computed(() => this.detalle()?.auditor?.nombre ?? null);

  protected readonly inicialesAuditor = computed(() => {
    const nombre = this.nombreAuditor();
    return nombre ? initialsFromNombreCompleto(nombre) : '';
  });

  protected readonly variantePorEstado = computed<BadgeVariant>(() => {
    switch (this.detalle()?.estado) {
      case 'CERTIFICACION_EMITIDA':
        return 'success';
      case 'OBSERVACIONES_PENDIENTES':
        return 'warning';
      case 'SOLICITUD_ENVIADA':
        return 'neutral';
      default:
        return 'info';
    }
  });

  /**
   * La línea de tiempo dibuja el recorrido completo, no solo lo ocurrido: los pasos que todavía no
   * pasaron se muestran en gris. La fecha y el responsable salen del historial, que es la única
   * fuente de esos datos; un paso sin transición registrada no inventa ninguno.
   */
  protected readonly pasos = computed<PasoLineaTiempo[]>(() => {
    const detalle = this.detalle();
    if (!detalle) {
      return [];
    }

    const secuencia = this.secuenciaDePasos(detalle.estado);
    const indiceActual = secuencia.indexOf(detalle.estado);

    return secuencia.map((estado, indice) => {
      // La última y no la primera: un estado puede alcanzarse más de una vez (la solicitud vuelve
      // a "enviada" tras un rechazo), y lo que la línea de tiempo tiene que mostrar es lo vigente.
      const transicion = detalle.historial
        .filter((entrada) => entrada.estadoNuevo === estado)
        .at(-1);
      return {
        estado,
        titulo: TITULOS_PASO[estado],
        situacion: this.situacionDe(indice, indiceActual),
        fecha: transicion?.fecha ?? null,
        responsable: transicion?.responsable ?? null,
      };
    });
  });

  ngOnInit(): void {
    void this.cargaInicial();

    document.addEventListener('visibilitychange', this.alCambiarVisibilidad);
    this.suscripcionSondeo = this.visibilidad
      .pipe(
        switchMap((visible) =>
          visible ? timer(INTERVALO_SONDEO_DETALLE_MS, INTERVALO_SONDEO_DETALLE_MS) : EMPTY
        ),
        switchMap(() =>
          // El catchError va adentro del switchMap: afuera, el error terminaría el stream externo
          // y el sondeo quedaría muerto hasta que el usuario recargue la página.
          this.auditoriasService.obtenerDetalle(this.idSolicitud()).pipe(
            catchError(() => {
              this.errorSondeo.set(ERROR_SONDEO);
              return EMPTY;
            })
          )
        )
      )
      .subscribe((detalle) => {
        this.errorSondeo.set(null);
        this.detalle.set(detalle);
      });

    this.visibilidad.next(!document.hidden);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.alCambiarVisibilidad);
    this.suscripcionSondeo?.unsubscribe();
    this.visibilidad.complete();
  }

  private readonly alCambiarVisibilidad = (): void => {
    this.visibilidad.next(!document.hidden);
  };

  private async cargaInicial(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(null);
    try {
      this.detalle.set(
        await firstValueFrom(this.auditoriasService.obtenerDetalle(this.idSolicitud()))
      );
    } catch (err: unknown) {
      this.errorCarga.set(this.mensajeDeError(err));
    } finally {
      this.cargando.set(false);
    }
  }

  private mensajeDeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) {
        return ERROR_NO_ENCONTRADA;
      }
      if (err.status === 403) {
        return ERROR_SIN_PERMISO;
      }
    }
    return apiErrorMessage(err) ?? ERROR_CARGA;
  }

  /**
   * Con observaciones pendientes el recorrido no termina en la certificación, así que ese último
   * paso se sustituye en vez de agregarse: mostrar los dos daría a entender que la auditoría sigue
   * camino a certificar cuando en realidad quedó detenida.
   */
  private secuenciaDePasos(estado: EstadoSolicitudAuditoria): EstadoSolicitudAuditoria[] {
    const secuencia = [...PASOS_AUDITORIA];
    if (estado === 'OBSERVACIONES_PENDIENTES') {
      secuencia[secuencia.length - 1] = 'OBSERVACIONES_PENDIENTES';
    }
    return secuencia;
  }

  private situacionDe(indice: number, indiceActual: number): SituacionPaso {
    if (indice < indiceActual) {
      return 'completado';
    }
    return indice === indiceActual ? 'en-curso' : 'pendiente';
  }
}
