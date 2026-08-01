import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { inicialesDe } from '../../../shared/utils/iniciales.utils';
import { AuditorResumen } from '../../auditores/auditor.model';
import { AuditoresService } from '../../auditores/auditores.service';
import { OrigenAsignacion, OrigenAsignacionRequest } from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';

const TOTAL_ESTRELLAS = 5;
const DURACION_TOAST_MS = 5000;

const ERROR_DIRECTORIO = 'No se pudo cargar el directorio de auditores. Intente nuevamente.';
const ERROR_SOLICITUD_INEXISTENTE = 'La solicitud de auditoría no existe.';
const ERROR_PERMISO = 'No tiene permiso para asignar un auditor a esta solicitud.';
const ERROR_YA_ASIGNADA = 'Ya existe una solicitud de revisión pendiente con otro auditor.';
const ERROR_AUDITOR_INVALIDO = 'Este auditor no está disponible actualmente.';
const ERROR_GENERICO = 'No se pudo asignar el auditor. Intente nuevamente.';

interface TarjetaAuditor {
  auditor: AuditorResumen;
  iniciales: string;
  estrellas: boolean[];
  etiquetas: string[];
}

interface AsignacionPendiente {
  nombre: string;
  iniciales: string;
  fotoPerfil: string;
  origen: OrigenAsignacion;
}

@Component({
  selector: 'app-asignar-auditor-page',
  imports: [
    ShellLayoutComponent,
    HeadingComponent,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  templateUrl: './asignar-auditor-page.component.html',
  styleUrl: './asignar-auditor-page.component.scss',
})
export class AsignarAuditorPageComponent implements OnInit {
  private readonly auditoresService = inject(AuditoresService);
  private readonly auditoriasService = inject(AuditoriasService);
  private readonly toastService = inject(ToastService);

  /** Id de la solicitud, enlazado desde la ruta empresa/auditorias/:id/auditor. */
  readonly id = input.required<string>();

  protected readonly auditores = signal<AuditorResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly enviando = signal(false);
  protected readonly seleccionadoId = signal<string | null>(null);
  protected readonly asignacion = signal<AsignacionPendiente | null>(null);
  protected readonly errorAsignacion = signal<string | null>(null);
  /** Estado terminal: la solicitud no existe o es de otra empresa, así que no hay nada que asignar. */
  protected readonly errorSolicitud = signal<string | null>(null);

  private readonly etiquetasEspecialidad = signal(new Map<string, string>());

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Asignar auditor',
    showNotificationDot: true,
    showBackButton: true,
  };

  protected readonly tarjetas = computed<TarjetaAuditor[]>(() =>
    this.auditores().map((auditor) => this.tarjeta(auditor))
  );

  protected readonly sinAuditores = computed(
    () => !this.cargando() && !this.errorCarga() && this.auditores().length === 0
  );

  protected readonly hayAsignacion = computed(() => this.asignacion() !== null);

  protected readonly auditorSeleccionado = computed(
    () => this.auditores().find((auditor) => auditor.auditorId === this.seleccionadoId()) ?? null
  );

  protected readonly puedeAsignar = computed(
    () => this.auditorSeleccionado() !== null && !this.enviando() && !this.hayAsignacion()
  );

  protected readonly etiquetaAsignar = computed(() => {
    const auditor = this.auditorSeleccionado();
    return auditor === null
      ? 'Seleccione un auditor para asignarlo'
      : `Asignar a ${auditor.nombre}`;
  });

  constructor() {
    void this.cargarAuditores();
  }

  ngOnInit(): void {
    // Se hace acá y no en el constructor porque `id` es un input y todavía no está disponible.
    void this.cargarAsignacionExistente();
  }

  /**
   * Rehidrata la asignación ya registrada para que, al recargar la pantalla, los botones de
   * selección sigan ocultos mientras la solicitud tenga un auditor pendiente de responder.
   * Un 404 o un 403 son terminales: no hay solicitud que asignar, así que la pantalla se corta.
   */
  private async cargarAsignacionExistente(): Promise<void> {
    try {
      const solicitud = await firstValueFrom(this.auditoriasService.obtenerSolicitud(this.id()));
      const auditor = solicitud?.auditor;
      if (auditor === null || auditor === undefined) return;

      this.asignacion.set({
        nombre: auditor.nombre,
        iniciales: inicialesDe(auditor.nombre),
        fotoPerfil: '',
        origen: solicitud.origenAsignacion ?? 'MANUAL',
      });
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse && (err.status === 404 || err.status === 403)) {
        this.errorSolicitud.set(mensajeDeError(err));
        return;
      }
      // Cualquier otro fallo (red, 500) no bloquea: la pantalla queda utilizable para asignar
      // y el backend vuelve a validar al recibir la asignación.
    }
  }

  protected estaSeleccionado(auditorId: string): boolean {
    return this.seleccionadoId() === auditorId;
  }

  protected seleccionar(auditor: AuditorResumen): void {
    if (this.enviando() || this.hayAsignacion()) return;
    this.errorAsignacion.set(null);
    this.seleccionadoId.update((actual) =>
      actual === auditor.auditorId ? null : auditor.auditorId
    );
  }

  protected asignar(): void {
    void this.enviarAsignacion('manual');
  }

  protected reintentar(): void {
    void this.cargarAuditores();
  }

  private async enviarAsignacion(origenAsignacion: OrigenAsignacionRequest): Promise<void> {
    const auditor = this.auditorSeleccionado();
    if (auditor === null || this.enviando() || this.hayAsignacion()) return;

    this.enviando.set(true);
    this.errorAsignacion.set(null);
    try {
      const solicitud = await firstValueFrom(
        this.auditoriasService.asignarAuditor(this.id(), {
          idAuditor: auditor.auditorId,
          origenAsignacion,
        })
      );
      const nombre = solicitud?.auditor?.nombre ?? auditor.nombre;
      this.asignacion.set({
        nombre,
        iniciales: inicialesDe(nombre),
        fotoPerfil: auditor.fotoPerfil ?? '',
        origen: solicitud?.origenAsignacion ?? 'MANUAL',
      });
      this.toastService.success(mensajeSolicitudEnviada(nombre), undefined, DURACION_TOAST_MS);
    } catch (err: unknown) {
      const mensaje = mensajeDeError(err);
      this.errorAsignacion.set(mensaje);
      this.toastService.error(mensaje, undefined, DURACION_TOAST_MS);
      // El 409 solo ocurre si la solicitud ya tiene otro auditor: elegir uno distinto volvería a
      // fallar, así que se relee la solicitud para mostrar la asignación real.
      if (err instanceof HttpErrorResponse && err.status === 409) {
        await this.cargarAsignacionExistente();
        // Con la asignación real en pantalla, la alerta roja sobra y además se contradice con
        // ella. No se puede limpiar en `seleccionar()` porque ese método corta apenas hay una
        // asignación, así que quedaría visible para siempre. El toast ya avisó del conflicto.
        if (this.hayAsignacion()) {
          this.errorAsignacion.set(null);
        }
      }
    } finally {
      this.enviando.set(false);
    }
  }

  private async cargarAuditores(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(false);
    await this.cargarEspecialidades();

    try {
      const pagina = await firstValueFrom(
        this.auditoresService.listar({
          terminoBusqueda: '',
          especialidades: [],
          zonaGeografica: null,
          calificacionMinima: null,
          soloDisponibles: true,
          pagina: 0,
          ordenamiento: 'CALIFICACION',
        })
      );
      this.auditores.set(pagina?.contenido ?? []);
    } catch (err: unknown) {
      this.errorCarga.set(true);
      this.toastService.error(
        apiErrorMessage(err) ?? ERROR_DIRECTORIO,
        undefined,
        DURACION_TOAST_MS
      );
    } finally {
      this.cargando.set(false);
    }
  }

  /** El catálogo solo aporta etiquetas legibles: si falla, se muestran las claves crudas. */
  private async cargarEspecialidades(): Promise<void> {
    try {
      const catalogo = await firstValueFrom(this.auditoresService.obtenerEspecialidades());
      this.etiquetasEspecialidad.set(
        new Map((catalogo ?? []).map((item) => [item.valor, item.etiqueta]))
      );
    } catch {
      this.etiquetasEspecialidad.set(new Map());
    }
  }

  private tarjeta(auditor: AuditorResumen): TarjetaAuditor {
    const redondeada =
      auditor.calificacionPromedio === null ? 0 : Math.round(auditor.calificacionPromedio);
    return {
      auditor,
      iniciales: inicialesDe(auditor.nombre),
      estrellas: Array.from({ length: TOTAL_ESTRELLAS }, (_, indice) => indice < redondeada),
      etiquetas: auditor.especialidadesPrincipales.map(
        (clave) => this.etiquetasEspecialidad().get(clave) ?? clave
      ),
    };
  }
}

function mensajeSolicitudEnviada(nombreAuditor: string): string {
  return `Solicitud enviada a ${nombreAuditor}. Te notificaremos cuando responda.`;
}

function mensajeDeError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return ERROR_GENERICO;

  const mensajeApi = apiErrorMessage(err);
  switch (err.status) {
    case 403:
      return mensajeApi ?? ERROR_PERMISO;
    case 404:
      return mensajeApi ?? ERROR_SOLICITUD_INEXISTENTE;
    case 409:
      return mensajeApi ?? ERROR_YA_ASIGNADA;
    case 422:
      return mensajeApi ?? ERROR_AUDITOR_INVALIDO;
    default:
      return mensajeApi ?? ERROR_GENERICO;
  }
}
