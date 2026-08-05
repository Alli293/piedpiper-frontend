import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import {
  form,
  FormField,
  maxLength,
  minLength,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { EMPTY, Subject, Subscription, firstValueFrom, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { abrirPestanaEnBlanco, mostrarBlobEnPestana } from '../../../shared/utils/download.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { initialsFromNombreCompleto } from '../../../shared/utils/initials.utils';
import {
  DetalleSolicitudAuditoria,
  EstadoSolicitudAuditoria,
  HORAS_PARA_RESPONDER,
  INTERVALO_SONDEO_DETALLE_MS,
  MAXIMO_CARACTERES_MOTIVO_RECHAZO,
  MINIMO_CARACTERES_MOTIVO_RECHAZO,
  PASOS_AUDITORIA,
  ResponderDecisionRequest,
} from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';

type SituacionPaso = 'completado' | 'en-curso' | 'pendiente';

interface RechazoFormModel {
  motivoRechazo: string;
}

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
const BYTES_POR_MB = 1024 * 1024;

const ERROR_CARGA = 'No se pudo cargar el detalle de la auditoría. Intenta nuevamente.';
const ERROR_DECISION = 'No se pudo registrar tu respuesta. Intenta nuevamente.';
const MENSAJE_ACEPTADA = 'Aceptaste la solicitud. La auditoría quedó en revisión.';
const MENSAJE_RECHAZADA = 'Rechazaste la solicitud. La empresa fue notificada.';
const MENSAJE_MOTIVO_REQUERIDO = 'Indica el motivo del rechazo.';
const ERROR_DOCUMENTO = 'No se pudo abrir el documento. Intenta nuevamente.';
const AVISO_VENTANA_BLOQUEADA =
  'Tu navegador bloqueó la ventana emergente. Permítelas para ver el documento.';

const MILISEGUNDOS_POR_HORA = 60 * 60 * 1000;
const HORAS_POR_DIA = 24;

/** 403 y 404 son definitivos: reintentar no los cambia. El resto puede ser un fallo pasajero. */
function esErrorPermanente(err: unknown): boolean {
  return err instanceof HttpErrorResponse && (err.status === 403 || err.status === 404);
}

@Component({
  selector: 'app-detalle-auditoria-page',
  imports: [
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    DatePipe,
    HeadingComponent,
    IconComponent,
    FormField,
    ShellLayoutComponent,
    TextareaComponent,
  ],
  templateUrl: './detalle-auditoria-page.component.html',
  styleUrl: './detalle-auditoria-page.component.scss',
})
export class DetalleAuditoriaPageComponent implements OnInit, OnDestroy {
  readonly idSolicitud = input.required<string>({ alias: 'id' });

  private readonly auditoriasService = inject(AuditoriasService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  private readonly visibilidad = new Subject<boolean>();
  private suscripcionSondeo?: Subscription;

  /** Se puso en true tras un 403 o un 404: no tiene sentido volver a preguntar. */
  private accesoDescartado = false;

  protected readonly detalle = signal<DetalleSolicitudAuditoria | null>(null);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorSondeo = signal<string | null>(null);
  protected readonly mostrandoRechazo = signal(false);
  protected readonly motivoRechazo = signal('');
  protected readonly enviandoDecision = signal(false);

  /**
   * Marca de tiempo que refresca el contador. Se actualiza en cada ciclo del sondeo en vez de con
   * un temporizador propio: el contador se muestra en dias u horas completas, asi que refrescarlo
   * cada 15 segundos ya es mas fino de lo que la pantalla llega a mostrar.
   */
  private readonly ahora = signal(Date.now());

  protected readonly minimoMotivo = MINIMO_CARACTERES_MOTIVO_RECHAZO;
  protected readonly maximoMotivo = MAXIMO_CARACTERES_MOTIVO_RECHAZO;

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'AUDITORÍAS',
    pageTitle: 'Detalle de Auditoría',
    showNotificationDot: true,
    showBackButton: true,
  };

  protected readonly modeloRechazo = signal<RechazoFormModel>({ motivoRechazo: '' });

  protected readonly rechazoForm = form(
    this.modeloRechazo,
    schema<RechazoFormModel>((path) => {
      required(path.motivoRechazo, { message: MENSAJE_MOTIVO_REQUERIDO });
      minLength(path.motivoRechazo, MINIMO_CARACTERES_MOTIVO_RECHAZO, {
        message: `El motivo debe tener al menos ${MINIMO_CARACTERES_MOTIVO_RECHAZO} caracteres.`,
      });
      maxLength(path.motivoRechazo, MAXIMO_CARACTERES_MOTIVO_RECHAZO, {
        message: `El motivo no puede superar los ${MAXIMO_CARACTERES_MOTIVO_RECHAZO} caracteres.`,
      });
    })
  );

  protected readonly caracteresMotivo = computed(
    () => this.modeloRechazo().motivoRechazo.trim().length
  );

  /** Sale del propio formulario para no repetir los limites que ya declara el schema. */
  protected readonly motivoValido = computed(() => this.rechazoForm.motivoRechazo().valid());

  /**
   * Las acciones solo aparecen para el auditor que tiene la asignacion pendiente. El backend valida
   * lo mismo, asi que esconderlas no es la proteccion: es no ofrecerle al usuario un boton que solo
   * le puede devolver un error.
   */
  protected readonly puedeResponder = computed(() => {
    const detalle = this.detalle();
    if (!detalle || !detalle.auditor || detalle.fechaAceptacion || !detalle.fechaAsignacion) {
      return false;
    }
    return detalle.auditor.id === this.authSession.getUserId();
  });

  private readonly horasRestantes = computed(() => {
    const asignacion = this.detalle()?.fechaAsignacion;
    if (!asignacion) {
      return 0;
    }
    const vencimiento =
      new Date(asignacion).getTime() + HORAS_PARA_RESPONDER * MILISEGUNDOS_POR_HORA;
    return Math.max(0, (vencimiento - this.ahora()) / MILISEGUNDOS_POR_HORA);
  });

  /**
   * Dias completos mientras falte mas de un dia, y horas completas en el ultimo dia. Ambos hacia
   * abajo: redondear hacia arriba prometeria al auditor un tiempo que en realidad ya no tiene.
   */
  protected readonly tiempoRestante = computed(() => {
    const horas = this.horasRestantes();
    if (horas <= 0) {
      return 'El plazo para responder venció';
    }
    if (horas > HORAS_POR_DIA) {
      const dias = Math.floor(horas / HORAS_POR_DIA);
      return `Quedan ${dias} ${dias === 1 ? 'día' : 'días'}`;
    }
    const horasEnteras = Math.floor(horas);
    return `Quedan ${horasEnteras} ${horasEnteras === 1 ? 'hora' : 'horas'}`;
  });

  protected readonly plazoVencido = computed(() => this.horasRestantes() <= 0);

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
      const situacion = this.situacionDe(indice, indiceActual);
      // Un paso pendiente no muestra datos aunque el historial tenga una entrada suya: si la
      // solicitud retrocedió (rechazo, vencimiento), esa entrada es de un intento ya superado.
      const vigente = situacion !== 'pendiente' ? transicion : undefined;
      return {
        estado,
        titulo: TITULOS_PASO[estado],
        situacion,
        fecha: vigente?.fecha ?? null,
        responsable: vigente?.responsable ?? null,
      };
    });
  });

  ngOnInit(): void {
    void this.iniciar();
  }

  /**
   * El sondeo arranca recien cuando la carga inicial termino. Arrancarlo en paralelo abria una
   * carrera: si la peticion inicial tarda mas que el primer ciclo, su respuesta llega despues y
   * pisa el detalle con datos mas viejos que los que ya se habian mostrado.
   */
  private async iniciar(): Promise<void> {
    await this.cargaInicial();

    // 403 y 404 no se arreglan solos: sondear no va a cambiar la respuesta, y el aviso de error
    // nunca se limpia, asi que la pantalla tampoco se recuperaria.
    if (this.accesoDescartado) {
      return;
    }

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
            catchError((err: unknown) => {
              if (esErrorPermanente(err)) {
                // El acceso se perdio a mitad de camino: al rechazar, el auditor deja de estar
                // asignado y la solicitud pasa a devolverle 403. Reintentar cada 15s no lo revierte.
                this.errorCarga.set(this.mensajeDeError(err));
                this.detenerSondeo();
                return EMPTY;
              }
              this.errorSondeo.set(ERROR_SONDEO);
              return EMPTY;
            })
          )
        )
      )
      .subscribe((detalle) => {
        this.errorSondeo.set(null);
        this.detalle.set(detalle);
        this.ahora.set(Date.now());
      });

    this.visibilidad.next(!document.hidden);
  }

  ngOnDestroy(): void {
    this.detenerSondeo();
  }

  private detenerSondeo(): void {
    document.removeEventListener('visibilitychange', this.alCambiarVisibilidad);
    this.suscripcionSondeo?.unsubscribe();
    this.suscripcionSondeo = undefined;
  }

  private readonly alCambiarVisibilidad = (): void => {
    this.visibilidad.next(!document.hidden);
  };

  protected readonly documentoAbriendo = signal<string | null>(null);

  /**
   * La pestana se abre en el mismo clic y recien despues se le carga el contenido. Abrirla al
   * volver la peticion la deja fuera de la ventana de activacion del usuario y el navegador la
   * bloquea como emergente, que era lo que pasaba con el documento a medio traer.
   */
  protected async verDocumento(idDocumento: string): Promise<void> {
    const pestana = abrirPestanaEnBlanco();
    if (!pestana) {
      this.toastService.error(AVISO_VENTANA_BLOQUEADA);
      return;
    }

    this.documentoAbriendo.set(idDocumento);
    try {
      const blob = await firstValueFrom(
        this.auditoriasService.descargarDocumento(this.idSolicitud(), idDocumento)
      );
      mostrarBlobEnPestana(pestana, blob);
    } catch (err: unknown) {
      pestana.close();
      this.toastService.error(apiErrorMessage(err) ?? ERROR_DOCUMENTO);
    } finally {
      this.documentoAbriendo.set(null);
    }
  }

  protected abrirRechazo(): void {
    this.mostrandoRechazo.set(true);
  }

  protected cancelarRechazo(): void {
    this.mostrandoRechazo.set(false);
    this.modeloRechazo.set({ motivoRechazo: '' });
  }

  protected aceptar(): void {
    void this.responder({ decision: 'aceptada' }, MENSAJE_ACEPTADA);
  }

  protected confirmarRechazo(event: Event): void {
    event.preventDefault();
    void this.enviarRechazo();
  }

  private async enviarRechazo(): Promise<void> {
    await submit(this.rechazoForm, {
      action: async (field) => {
        await this.responder(
          { decision: 'rechazada', motivoRechazo: field().value().motivoRechazo.trim() },
          MENSAJE_RECHAZADA
        );
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  /**
   * Tras responder se recarga el detalle en vez de asumir el nuevo estado: la respuesta del
   * servidor es la unica que sabe en que estado quedo la solicitud, y ademas trae la entrada nueva
   * de la linea de tiempo.
   */
  private async responder(request: ResponderDecisionRequest, mensajeExito: string): Promise<void> {
    this.enviandoDecision.set(true);
    try {
      await firstValueFrom(this.auditoriasService.responderDecision(this.idSolicitud(), request));
      this.mostrandoRechazo.set(false);
      this.modeloRechazo.set({ motivoRechazo: '' });
      this.toastService.success(mensajeExito);
      await this.cargaInicial();
    } catch (err: unknown) {
      this.toastService.error(apiErrorMessage(err) ?? ERROR_DECISION);
      // Se recarga igual: un 409 significa que la solicitud cambio por otro lado, y dejar la
      // pantalla con el estado viejo invitaria a reintentar sobre algo que ya no existe.
      await this.cargaInicial();
    } finally {
      this.enviandoDecision.set(false);
    }
  }

  private async cargaInicial(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(null);
    try {
      this.detalle.set(
        await firstValueFrom(this.auditoriasService.obtenerDetalle(this.idSolicitud()))
      );
      this.ahora.set(Date.now());
    } catch (err: unknown) {
      this.errorCarga.set(this.mensajeDeError(err));
      this.accesoDescartado = esErrorPermanente(err);
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * El tamano llega en bytes desde el backend y en la tarjeta se muestra en MB. Si no llega un
   * numero utilizable se muestra un guion: es un dato accesorio y "NaN MB" seria peor que no
   * mostrar nada.
   */
  protected pesoLegible(tamanioBytes: number | null | undefined): string {
    if (typeof tamanioBytes !== 'number' || !Number.isFinite(tamanioBytes) || tamanioBytes < 0) {
      return '—';
    }
    return `${(tamanioBytes / BYTES_POR_MB).toFixed(1)} MB`;
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
