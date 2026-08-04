import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  maxDate,
  maxLength,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { DateInputComponent } from '../../../shared/components/inputs/date-input/date-input.component';
import { FileDropComponent } from '../../../shared/components/inputs/file-drop/file-drop.component';
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { todayUtcMidnight, toIsoDateString } from '../../../shared/utils/date.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import {
  MAXIMO_BYTES_DOCUMENTO,
  MAXIMO_CARACTERES_DESCRIPCION,
  MAXIMO_DOCUMENTOS_SOLICITUD,
  MAXIMO_MESES_PERIODO,
  NuevaSolicitudAuditoriaRequest,
} from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';

const DURACION_TOAST_MS = 5000;

const MENSAJE_INICIO_FUTURO = 'El período a auditar no puede iniciar en una fecha futura.';
const MENSAJE_PERIODO_EXCEDIDO = 'El período a auditar no puede exceder 12 meses.';
const MENSAJE_FIN_ANTERIOR = 'La fecha de fin debe ser posterior a la fecha de inicio.';
const MENSAJE_DESCRIPCION_LARGA = 'La descripción no puede superar 500 caracteres.';

const ERROR_DOCUMENTOS = 'No se pudieron procesar los documentos adjuntos. Revise los archivos.';
const ERROR_PERIODO = 'El período indicado no es válido.';
const ERROR_TRASLAPE = 'Ya existe una solicitud de auditoría para un período traslapado.';
const ERROR_PERMISO = 'No tiene permiso para crear solicitudes de auditoría.';
const ERROR_GENERICO = 'No se pudo crear la solicitud. Intente nuevamente.';

interface NuevaSolicitudFormModel {
  periodoInicio: Date | null;
  periodoFin: Date | null;
  descripcionSolicitud: string;
}

@Component({
  selector: 'app-nueva-solicitud-page',
  imports: [
    FormField,
    ShellLayoutComponent,
    HeadingComponent,
    DateInputComponent,
    TextareaComponent,
    FileDropComponent,
    ButtonComponent,
  ],
  templateUrl: './nueva-solicitud-page.component.html',
  styleUrl: './nueva-solicitud-page.component.scss',
})
export class NuevaSolicitudPageComponent {
  private readonly auditoriasService = inject(AuditoriasService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly maximoDocumentos = MAXIMO_DOCUMENTOS_SOLICITUD;
  protected readonly maximoBytesDocumento = MAXIMO_BYTES_DOCUMENTO;
  protected readonly maximoCaracteresDescripcion = MAXIMO_CARACTERES_DESCRIPCION;
  protected readonly hoy = todayUtcMidnight();

  protected readonly documentos = signal<File[]>([]);
  protected readonly enviando = signal(false);

  protected readonly model = signal<NuevaSolicitudFormModel>({
    periodoInicio: null,
    periodoFin: null,
    descripcionSolicitud: '',
  });

  protected readonly solicitudForm = form(
    this.model,
    schema<NuevaSolicitudFormModel>((path) => {
      required(path.periodoInicio, { message: 'Seleccione la fecha de inicio del período.' });
      maxDate(path.periodoInicio, this.hoy, { message: MENSAJE_INICIO_FUTURO });

      required(path.periodoFin, { message: 'Seleccione la fecha de fin del período.' });
      validate(path.periodoFin, (ctx) => {
        const fin = ctx.value();
        const inicio = ctx.valueOf(path.periodoInicio);
        if (fin === null || inicio === null) return undefined;
        if (fin.getTime() <= inicio.getTime()) {
          return { kind: 'finAnterior', message: MENSAJE_FIN_ANTERIOR };
        }
        if (fin.getTime() > limiteSuperior(inicio).getTime()) {
          return { kind: 'periodoExcedido', message: MENSAJE_PERIODO_EXCEDIDO };
        }
        return undefined;
      });

      maxLength(path.descripcionSolicitud, MAXIMO_CARACTERES_DESCRIPCION, {
        message: MENSAJE_DESCRIPCION_LARGA,
      });

      disabled(path.periodoInicio, { when: () => this.enviando() });
      disabled(path.periodoFin, { when: () => this.enviando() });
      disabled(path.descripcionSolicitud, { when: () => this.enviando() });
    })
  );

  protected readonly periodoInicioError = computed(() =>
    fieldError(this.solicitudForm.periodoInicio())
  );
  protected readonly periodoFinError = computed(() => fieldError(this.solicitudForm.periodoFin()));
  protected readonly descripcionError = computed(() =>
    fieldError(this.solicitudForm.descripcionSolicitud())
  );

  protected readonly caracteresDescripcion = computed(
    () => this.model().descripcionSolicitud.length
  );

  protected readonly hayDocumentos = computed(() => this.documentos().length > 0);

  protected readonly puedeEnviar = computed(
    () => this.solicitudForm().valid() && this.hayDocumentos() && !this.enviando()
  );

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Nueva solicitud de auditoría',
    showNotificationDot: true,
    showBackButton: true,
  };

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.crearSolicitud();
  }

  private async crearSolicitud(): Promise<void> {
    await submit(this.solicitudForm, {
      action: async (field) => {
        const documentos = this.documentos();
        if (documentos.length === 0) {
          this.toastService.error(
            'Adjunte al menos un documento de respaldo.',
            undefined,
            DURACION_TOAST_MS
          );
          return undefined;
        }

        const value = field().value();
        if (value.periodoInicio === null || value.periodoFin === null) return undefined;

        const request: NuevaSolicitudAuditoriaRequest = {
          periodoInicio: toIsoDateString(value.periodoInicio),
          periodoFin: toIsoDateString(value.periodoFin),
          descripcionSolicitud: value.descripcionSolicitud.trim() || null,
        };

        this.enviando.set(true);
        try {
          const solicitud = await firstValueFrom(
            this.auditoriasService.crearSolicitud(request, documentos)
          );
          this.toastService.success(
            'Solicitud de auditoría creada. Seleccione el auditor que la atenderá.',
            undefined,
            DURACION_TOAST_MS
          );
          await this.router.navigateByUrl(`/empresa/auditorias/${solicitud.id}/auditor`);
        } catch (err: unknown) {
          this.mostrarError(err);
        } finally {
          this.enviando.set(false);
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  /** El formulario conserva los datos ingresados para permitir reintentar. */
  private mostrarError(err: unknown): void {
    this.toastService.error(mensajeDeError(err), undefined, DURACION_TOAST_MS);
  }
}

function mensajeDeError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return ERROR_GENERICO;

  const mensajeApi = apiErrorMessage(err);
  switch (err.status) {
    case 400:
      return mensajeApi ?? ERROR_DOCUMENTOS;
    case 403:
      return mensajeApi ?? ERROR_PERMISO;
    case 409:
      return mensajeApi ?? ERROR_TRASLAPE;
    case 422:
      return mensajeApi ?? ERROR_PERIODO;
    default:
      return mensajeApi ?? ERROR_GENERICO;
  }
}

function limiteSuperior(inicio: Date): Date {
  return new Date(
    Date.UTC(
      inicio.getUTCFullYear(),
      inicio.getUTCMonth() + MAXIMO_MESES_PERIODO,
      inicio.getUTCDate()
    )
  );
}
