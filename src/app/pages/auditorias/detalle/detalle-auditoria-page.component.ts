import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  maxDate,
  maxLength,
  minDate,
  minLength,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { EMPTY, Subject, Subscription, firstValueFrom, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AUDITOR_CERTIFICADO, AuthSessionService } from '../../../core/auth-session.service';
import { CalificacionResponse } from '../../../core/calificacion/calificacion.models';
import { CalificacionService } from '../../../core/calificacion/calificacion.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { DateInputComponent } from '../../../shared/components/inputs/date-input/date-input.component';
import { FileDropComponent } from '../../../shared/components/inputs/file-drop/file-drop.component';
import { RadioGroupFieldComponent } from '../../../shared/components/inputs/radio-group-field/radio-group-field.component';
import { SelectOption } from '../../../shared/components/inputs/select-input/select-input.component';
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { todayUtcMidnight, toIsoDateString } from '../../../shared/utils/date.utils';
import { previsualizarBlobEnPestana } from '../../../shared/utils/download.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import {
  DetalleSolicitudAuditoria,
  EmitirResultadoAuditoriaRequest,
  EstadoSolicitudAuditoria,
  HORAS_PARA_RESPONDER,
  INTERVALO_SONDEO_DETALLE_MS,
  MAXIMO_CARACTERES_MOTIVO_RECHAZO,
  MAXIMO_CARACTERES_OBSERVACIONES,
  MAXIMO_BYTES_REPORTE_AUDITORIA,
  MINIMO_CARACTERES_MOTIVO_RECHAZO,
  MINIMO_CARACTERES_OBSERVACIONES,
  PASOS_AUDITORIA,
  ResponderDecisionRequest,
  ResultadoAuditoriaRequest,
} from '../auditoria.model';
import { variantePorEstadoAuditoria } from '../auditoria-estado.utils';
import { AuditoriasService } from '../auditorias.service';
import { CalificacionFormComponent } from '../../auditores/perfil-publico-auditor/calificacion-form/calificacion-form.component';

type SituacionPaso = 'completado' | 'en-curso' | 'pendiente';

interface RechazoFormModel {
  motivoRechazo: string;
}

interface CargaReporteFormModel {
  fechaAuditoriaRealizada: Date | null;
  reporteAuditoria: File[];
}

/**
 * Los dos campos conviven en el modelo aunque solo uno se muestre a la vez: cambiar de opción no
 * borra lo que el auditor ya había escrito en la otra, así que volver atrás no le cuesta reescribir.
 * La validación de cada uno se apaga cuando su opción no está seleccionada.
 */
interface ResultadoFormModel {
  resultado: ResultadoAuditoriaRequest | null;
  observaciones: string;
  fechaVencimientoCert: Date | null;
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
const ERROR_RESULTADO = 'No se pudo emitir el resultado de la auditoría. Intenta nuevamente.';

const ERROR_CARGA = 'No se pudo cargar el detalle de la auditoría. Intenta nuevamente.';
const ERROR_DECISION = 'No se pudo registrar tu respuesta. Intenta nuevamente.';
const ERROR_REPORTE = 'No se pudo cargar el reporte de auditoría. Intenta nuevamente.';
const MENSAJE_REPORTE_REQUERIDO = 'Selecciona el reporte de auditoría en PDF.';
const MENSAJE_FECHA_REPORTE_REQUERIDA = 'Selecciona la fecha en que realizaste la auditoría.';
const MENSAJE_FECHA_REPORTE_INVALIDA =
  'La fecha de la auditoría debe estar entre la fecha de aceptación y la fecha actual.';
const MENSAJE_CARGA_DESHABILITADA =
  'La carga del reporte estará disponible una vez que la auditoría esté en revisión.';
const MENSAJE_ACEPTADA = 'Aceptaste la solicitud. La auditoría quedó en revisión.';
const MENSAJE_RECHAZADA = 'Rechazaste la solicitud. La empresa fue notificada.';
const MENSAJE_MOTIVO_REQUERIDO = 'Indica el motivo del rechazo.';
const ERROR_DOCUMENTO = 'No se pudo abrir el documento. Intenta nuevamente.';
const AVISO_VENTANA_BLOQUEADA =
  'Tu navegador bloqueó la ventana emergente. Permítelas para ver el documento.';

const ZONA_HORARIA_NEGOCIO = 'America/Costa_Rica';
const FORMATEADOR_FECHA_NEGOCIO = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: ZONA_HORARIA_NEGOCIO,
  year: 'numeric',
});
const MILISEGUNDOS_POR_HORA = 60 * 60 * 1000;
const HORAS_POR_DIA = 24;
const MENSAJE_RESULTADO_APROBADO = 'Resultado aprobado. La certificación fue emitida.';
const MENSAJE_RESULTADO_OBSERVACIONES =
  'Resultado emitido con observaciones. La empresa debe corregir la documentación.';
const MENSAJE_RESULTADO_REQUERIDO = 'Selecciona el resultado de la auditoría.';
const MENSAJE_OBSERVACIONES_REQUERIDAS = `Describe las observaciones con al menos ${MINIMO_CARACTERES_OBSERVACIONES} caracteres.`;
const MENSAJE_OBSERVACIONES_LARGAS = `Las observaciones no pueden superar los ${MAXIMO_CARACTERES_OBSERVACIONES} caracteres.`;
const MENSAJE_VENCIMIENTO_REQUERIDO = 'Selecciona la fecha de vencimiento de la certificación.';
const MENSAJE_VENCIMIENTO_INVALIDO =
  'La fecha de vencimiento debe ser posterior a la fecha de la auditoría.';

const OPCIONES_RESULTADO: SelectOption[] = [
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'observaciones', label: 'Observaciones pendientes' },
];

/** 403 y 404 son definitivos: reintentar no los cambia. El resto puede ser un fallo pasajero. */
function esErrorPermanente(err: unknown): boolean {
  return err instanceof HttpErrorResponse && (err.status === 403 || err.status === 404);
}

@Component({
  selector: 'app-detalle-auditoria-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CalificacionFormComponent,
    DatePipe,
    DateInputComponent,
    HeadingComponent,
    IconComponent,
    FileDropComponent,
    FormField,
    RadioGroupFieldComponent,
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
  private readonly calificacionService = inject(CalificacionService);
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
  protected readonly enviandoReporte = signal(false);
  protected readonly enviandoResultado = signal(false);
  protected readonly mostrandoReemplazoReporte = signal(false);
  protected readonly errorReporteGeneral = signal<string | null>(null);
  protected readonly errorResultado = signal<string | null>(null);
  private readonly errorReporteServidor = signal<string | null>(null);
  private readonly errorFechaReporteServidor = signal<string | null>(null);

  /**
   * Marca de tiempo que refresca el contador. Se actualiza en cada ciclo del sondeo en vez de con
   * un temporizador propio: el contador se muestra en dias u horas completas, asi que refrescarlo
   * cada 15 segundos ya es mas fino de lo que la pantalla llega a mostrar.
   */
  private readonly ahora = signal(Date.now());

  protected readonly minimoMotivo = MINIMO_CARACTERES_MOTIVO_RECHAZO;
  protected readonly maximoMotivo = MAXIMO_CARACTERES_MOTIVO_RECHAZO;
  protected readonly maximoBytesReporte = MAXIMO_BYTES_REPORTE_AUDITORIA;
  protected readonly hoy = todayUtcMidnight();
  protected readonly mensajeCargaDeshabilitada = MENSAJE_CARGA_DESHABILITADA;

  /**
   * El detalle lo abren los dos roles y cada uno vuelve a su propio listado. Estaba fijo en
   * /empresa/panel, asi que al auditor el boton de volver lo mandaba a una ruta que su guard le
   * bloquea: quedaba rebotado al login en vez de volver a sus solicitudes.
   */
  protected readonly rutaVolver = computed(() =>
    this.authSession.getRole() === AUDITOR_CERTIFICADO
      ? '/auditor/auditorias'
      : '/empresa/auditorias'
  );

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'AUDITORÍAS',
    pageTitle: 'Detalle de Auditoría',
    showNotificationDot: true,
    showBackButton: true,
  };

  protected readonly modeloRechazo = signal<RechazoFormModel>({ motivoRechazo: '' });
  protected readonly modeloCargaReporte = signal<CargaReporteFormModel>({
    fechaAuditoriaRealizada: null,
    reporteAuditoria: [],
  });
  protected readonly modeloResultado = signal<ResultadoFormModel>({
    resultado: null,
    observaciones: '',
    fechaVencimientoCert: null,
  });

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

  protected readonly cargaReporteForm = form(
    this.modeloCargaReporte,
    schema<CargaReporteFormModel>((path) => {
      required(path.fechaAuditoriaRealizada, { message: MENSAJE_FECHA_REPORTE_REQUERIDA });
      maxDate(path.fechaAuditoriaRealizada, this.hoy, {
        message: MENSAJE_FECHA_REPORTE_INVALIDA,
      });
      validate(path.fechaAuditoriaRealizada, (ctx) => {
        const fecha = ctx.value();
        const minima = this.fechaMinimaReporte();
        if (fecha === null || minima === null) return undefined;
        if (fecha.getTime() < minima.getTime()) {
          return { kind: 'fechaAuditoriaFueraDeRango', message: MENSAJE_FECHA_REPORTE_INVALIDA };
        }
        return undefined;
      });
      validate(path.reporteAuditoria, ({ value }) =>
        value().length === 0
          ? { kind: 'reporteRequerido', message: MENSAJE_REPORTE_REQUERIDO }
          : undefined
      );
      disabled(path.fechaAuditoriaRealizada, { when: () => !this.puedeEditarReporte() });
      disabled(path.reporteAuditoria, { when: () => !this.puedeEditarReporte() });
    })
  );

  /**
   * Cada campo condicional valida solo cuando su opción está seleccionada. Con `required` a secas
   * el formulario nunca llegaría a válido, porque los dos resultados no pueden cumplirse a la vez.
   */
  protected readonly resultadoForm = form(
    this.modeloResultado,
    schema<ResultadoFormModel>((path) => {
      validate(path.resultado, ({ value }) =>
        value() === null
          ? { kind: 'resultadoRequerido', message: MENSAJE_RESULTADO_REQUERIDO }
          : undefined
      );

      validate(path.observaciones, ({ value }) => {
        if (!this.pideObservaciones()) return undefined;
        const texto = value().trim();
        if (texto.length < MINIMO_CARACTERES_OBSERVACIONES) {
          return { kind: 'observacionesCortas', message: MENSAJE_OBSERVACIONES_REQUERIDAS };
        }
        if (texto.length > MAXIMO_CARACTERES_OBSERVACIONES) {
          return { kind: 'observacionesLargas', message: MENSAJE_OBSERVACIONES_LARGAS };
        }
        return undefined;
      });

      validate(path.fechaVencimientoCert, ({ value }) =>
        this.pideVencimiento() && value() === null
          ? { kind: 'vencimientoRequerido', message: MENSAJE_VENCIMIENTO_REQUERIDO }
          : undefined
      );

      /**
       * Declarado como `minDate` y no como un `validate` a mano para que el propio calendario
       * deshabilite los días anteriores: la directiva propaga el mínimo al input nativo.
       */
      minDate(path.fechaVencimientoCert, () => this.fechaMinimaVencimiento(), {
        message: MENSAJE_VENCIMIENTO_INVALIDO,
      });
    })
  );

  protected readonly opcionesResultado = OPCIONES_RESULTADO;
  protected readonly minimoObservaciones = MINIMO_CARACTERES_OBSERVACIONES;
  protected readonly maximoObservaciones = MAXIMO_CARACTERES_OBSERVACIONES;

  protected readonly pideObservaciones = computed(
    () => this.modeloResultado().resultado === 'observaciones'
  );
  protected readonly pideVencimiento = computed(
    () => this.modeloResultado().resultado === 'aprobada'
  );

  protected readonly caracteresObservaciones = computed(
    () => this.modeloResultado().observaciones.trim().length
  );

  /**
   * Un día después de la auditoría: el backend exige que la vigencia sea posterior, así que el
   * mismo día que se auditó tampoco sirve y el calendario ya no lo ofrece.
   */
  protected readonly fechaMinimaVencimiento = computed<Date | undefined>(() => {
    const realizada = this.detalle()?.fechaAuditoriaRealizada;
    if (!realizada) return undefined;
    const minima = new Date(`${realizada}T00:00:00Z`);
    minima.setUTCDate(minima.getUTCDate() + 1);
    return minima;
  });

  protected readonly resultadoError = computed(() => fieldError(this.resultadoForm.resultado()));
  protected readonly observacionesError = computed(() =>
    fieldError(this.resultadoForm.observaciones())
  );
  protected readonly vencimientoError = computed(() =>
    fieldError(this.resultadoForm.fechaVencimientoCert())
  );

  protected readonly caracteresMotivo = computed(
    () => this.modeloRechazo().motivoRechazo.trim().length
  );

  /** Sale del propio formulario para no repetir los limites que ya declara el schema. */
  protected readonly motivoValido = computed(() => this.rechazoForm.motivoRechazo().valid());

  protected readonly fechaReporteError = computed(
    () =>
      this.errorFechaReporteServidor() ??
      fieldError(this.cargaReporteForm.fechaAuditoriaRealizada())
  );
  protected readonly reporteError = computed(
    () => this.errorReporteServidor() ?? fieldError(this.cargaReporteForm.reporteAuditoria())
  );

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

  protected readonly esAuditorAsignado = computed(() => {
    const detalle = this.detalle();
    return detalle?.auditor?.id === this.authSession.getUserId();
  });

  // === Calificación ===
  protected readonly calificacionExistente = signal<CalificacionResponse | null>(null);
  protected readonly empresaIdUsuario = computed(() => {
    const cal = this.calificacionExistente();
    return cal?.empresaId ?? '';
  });

  protected readonly esCertificacionEmitida = computed(
    () => this.detalle()?.estado === 'CERTIFICACION_EMITIDA'
  );

  protected readonly estadoPermiteReporte = computed(() => {
    const estado = this.detalle()?.estado;
    return estado === 'EN_REVISION' || estado === 'REPORTE_CARGADO';
  });

  protected readonly puedeEditarReporte = computed(
    () => this.esAuditorAsignado() && this.estadoPermiteReporte() && !this.enviandoReporte()
  );

  protected readonly puedeEnviarReporte = computed(
    () => this.puedeEditarReporte() && this.cargaReporteForm().valid() && !this.enviandoReporte()
  );

  /** Si el formulario se muestra. El botón de confirmar tiene su propia condición más estricta. */
  protected readonly puedeEmitirResultado = computed(() => {
    const detalle = this.detalle();
    return (
      this.esAuditorAsignado() &&
      detalle?.estado === 'REPORTE_CARGADO' &&
      !!detalle.reporteAuditoria &&
      !this.enviandoResultado()
    );
  });

  /**
   * El botón queda deshabilitado hasta que el campo obligatorio de la opción elegida sea válido.
   * El backend valida lo mismo; esto solo evita que el auditor llegue a un 422 evitable.
   */
  protected readonly puedeConfirmarResultado = computed(
    () => this.puedeEmitirResultado() && this.resultadoForm().valid()
  );

  protected readonly muestraFormularioReporte = computed(
    () =>
      this.estadoPermiteReporte() &&
      (!this.detalle()?.reporteAuditoria || this.mostrandoReemplazoReporte())
  );

  protected readonly fechaMinimaReporte = computed(() =>
    fechaNegocioDeIsoComoUtcMidnight(this.detalle()?.fechaAceptacion)
  );

  /**
   * El contador se calcula contra el reloj del navegador. Con el reloj del cliente mal puesto, el
   * "Quedan N horas" puede mostrar de mas o de menos; lo que no cambia es el resultado, porque el
   * plazo real lo hace cumplir el backend contra su propia hora al recibir la respuesta. Corregirlo
   * de verdad pide que el detalle devuelva la hora del servidor para calcular el desfase, y eso es
   * un campo nuevo en el contrato por un dato informativo: queda anotado, no hecho.
   */
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

  protected readonly variantePorEstado = computed(() =>
    variantePorEstadoAuditoria(this.detalle()?.estado)
  );

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
   * La pestaña se abre en el mismo clic y recién después se le carga el contenido: abrirla al
   * volver la petición la deja fuera de la ventana de activación del usuario y el navegador la
   * bloquea como emergente. Por eso el helper recibe como traer el documento y no el documento.
   */
  protected async verDocumento(idDocumento: string): Promise<void> {
    this.documentoAbriendo.set(idDocumento);
    try {
      const resultado = await previsualizarBlobEnPestana(() =>
        firstValueFrom(this.auditoriasService.descargarDocumento(this.idSolicitud(), idDocumento))
      );
      if (resultado === 'bloqueada') {
        this.toastService.error(AVISO_VENTANA_BLOQUEADA);
      }
    } catch (err: unknown) {
      this.toastService.error(apiErrorMessage(err) ?? ERROR_DOCUMENTO);
    } finally {
      this.documentoAbriendo.set(null);
    }
  }

  protected actualizarReporte(archivos: File[]): void {
    this.errorReporteGeneral.set(null);
    this.errorReporteServidor.set(null);
    this.modeloCargaReporte.update((modelo) => ({
      ...modelo,
      reporteAuditoria: archivos.slice(-1),
    }));
    this.cargaReporteForm.reporteAuditoria().markAsTouched();
  }

  protected handleCargaReporte(event: Event): void {
    event.preventDefault();
    void this.cargarReporte();
  }

  protected abrirReemplazoReporte(): void {
    this.errorReporteGeneral.set(null);
    this.errorFechaReporteServidor.set(null);
    this.errorReporteServidor.set(null);
    this.mostrandoReemplazoReporte.set(true);
  }

  protected handleSubmitResultado(event: Event): void {
    event.preventDefault();
    void this.confirmarResultado();
  }

  /**
   * Pasa por `submit()` como los otros dos formularios de la pantalla en vez de leer el modelo a
   * mano: asi el `[disabled]` del boton deja de ser la unica barrera. Si el binding cambiara en un
   * refactor, `onInvalid` sigue frenando el envio en vez de mandar datos que no validan.
   */
  private async confirmarResultado(): Promise<void> {
    await submit(this.resultadoForm, {
      action: async () => {
        await this.emitirResultado();
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  /**
   * Envía solo el campo que corresponde al resultado elegido. Mandar los dos haría que el auditor
   * publicara una vigencia de certificación en una devolución con observaciones, donde no hay
   * certificación que vencer.
   */
  private async emitirResultado(): Promise<void> {
    const { resultado, observaciones, fechaVencimientoCert } = this.modeloResultado();
    if (resultado === null) return;

    const aprueba = resultado === 'aprobada';
    if (aprueba && fechaVencimientoCert === null) return;

    const peticion: EmitirResultadoAuditoriaRequest =
      aprueba && fechaVencimientoCert !== null
        ? { resultado, fechaVencimientoCert: toIsoDateString(fechaVencimientoCert) }
        : { resultado, observaciones: observaciones.trim() };

    this.enviandoResultado.set(true);
    this.errorResultado.set(null);
    try {
      const detalle = await firstValueFrom(
        this.auditoriasService.emitirResultado(this.idSolicitud(), peticion)
      );
      this.detalle.set(detalle);
      this.toastService.success(
        aprueba ? MENSAJE_RESULTADO_APROBADO : MENSAJE_RESULTADO_OBSERVACIONES
      );
    } catch (err: unknown) {
      this.errorResultado.set(apiErrorMessage(err) ?? ERROR_RESULTADO);
      // Un fallo al emitir la certificacion ocurre despues de que el resultado ya quedo guardado,
      // asi que la solicitud puede haber avanzado aunque la respuesta sea un error. Sin este
      // refresco la linea de tiempo se queda en el paso anterior y el auditor vuelve a confirmar,
      // esta vez contra un estado final, y recibe un 409 que no explica nada.
      await this.refrescar();
    } finally {
      this.enviandoResultado.set(false);
    }
  }

  private async cargarReporte(): Promise<void> {
    await submit(this.cargaReporteForm, {
      action: async (field) => {
        const { fechaAuditoriaRealizada, reporteAuditoria } = field().value();
        const archivo = reporteAuditoria[0];
        if (!fechaAuditoriaRealizada || !archivo) return undefined;

        this.enviandoReporte.set(true);
        this.errorReporteGeneral.set(null);
        this.errorFechaReporteServidor.set(null);
        this.errorReporteServidor.set(null);
        try {
          const detalle = await firstValueFrom(
            this.auditoriasService.cargarReporte(
              this.idSolicitud(),
              archivo,
              toIsoDateString(fechaAuditoriaRealizada)
            )
          );
          this.detalle.set(detalle);
          this.mostrandoReemplazoReporte.set(false);
          this.modeloCargaReporte.set({ fechaAuditoriaRealizada: null, reporteAuditoria: [] });
          this.cargaReporteForm().reset();
          this.toastService.success('Reporte de auditoría cargado.');
        } catch (err: unknown) {
          this.asignarErrorReporte(err);
        } finally {
          this.enviandoReporte.set(false);
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
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
      await this.refrescar();
    } catch (err: unknown) {
      this.toastService.error(apiErrorMessage(err) ?? ERROR_DECISION);
      // Se refresca igual: un 409 significa que la solicitud cambio por otro lado, y dejar la
      // pantalla con el estado viejo invitaria a reintentar sobre algo que ya no existe.
      await this.refrescar();
    } finally {
      this.enviandoDecision.set(false);
    }
  }

  /**
   * Vuelve a pedir el detalle sin tocar {@link cargando}. Reusar la carga inicial mostraba de nuevo
   * el esqueleto completo, y despues de aceptar o rechazar eso se ve como un parpadeo de toda la
   * pantalla en vez de una actualizacion.
   */
  private async refrescar(): Promise<void> {
    try {
      this.detalle.set(
        await firstValueFrom(this.auditoriasService.obtenerDetalle(this.idSolicitud()))
      );
      this.ahora.set(Date.now());
    } catch {
      // El detalle en pantalla sigue siendo el ultimo que el servidor confirmo; el resultado de la
      // decision ya se informo por toast, asi que no hay nada mas que decirle al usuario aca.
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

      // Cargar calificación existente si la auditoría está completada
      if (this.esCertificacionEmitida() && !this.esAuditorAsignado()) {
        try {
          const cal = await firstValueFrom(
            this.calificacionService.obtenerPorAuditoria(this.idSolicitud())
          );
          this.calificacionExistente.set(cal);
        } catch {
          // No bloquear la vista si falla la carga de calificación
        }
      }
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

  private asignarErrorReporte(err: unknown): void {
    const mensaje = apiErrorMessage(err) ?? ERROR_REPORTE;
    // El backend todavía no expone códigos estructurados por campo; mientras tanto se clasifica
    // por mensaje normalizado para mostrar el error junto al control más útil.
    const normalizado = normalizarMensaje(mensaje);
    if (normalizado.includes('fecha de la auditoria')) {
      this.errorFechaReporteServidor.set(mensaje);
      return;
    }
    if (normalizado.includes('archivo') || normalizado.includes('pdf')) {
      this.errorReporteServidor.set(mensaje);
      return;
    }
    this.errorReporteGeneral.set(mensaje);
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

function fechaNegocioDeIsoComoUtcMidnight(fecha: string | null | undefined): Date | null {
  if (!fecha) return null;
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;

  const partes = FORMATEADOR_FECHA_NEGOCIO.formatToParts(valor);
  const anio = Number(partes.find((parte) => parte.type === 'year')?.value);
  const mes = Number(partes.find((parte) => parte.type === 'month')?.value);
  const dia = Number(partes.find((parte) => parte.type === 'day')?.value);

  if (!Number.isInteger(anio) || !Number.isInteger(mes) || !Number.isInteger(dia)) {
    return null;
  }
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function normalizarMensaje(mensaje: string): string {
  return mensaje
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
