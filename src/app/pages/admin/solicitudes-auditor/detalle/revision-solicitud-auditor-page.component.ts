import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required, schema, submit, validate } from '@angular/forms/signals';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../../shared/components/heading/heading.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TextareaComponent } from '../../../../shared/components/inputs/textarea/textarea.component';
import { formatearTamanio } from '../../../../shared/components/inputs/file-drop/file-drop.component';
import { ShellLayoutComponent } from '../../../../shared/layouts/shell-layout/shell-layout.component';
import { HeaderConfig } from '../../../../shared/layouts/page-layout/page-layout.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { fieldError } from '../../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { previsualizarBlobEnPestana } from '../../../../shared/utils/download.utils';
import {
  SolicitudDetalle,
  ValidacionService,
} from '../../../../core/validacion/validacion.service';
import { BadgeVariant } from '../../../../shared/components/badge/badge.component';

type DecisionValor = 'aprobado' | 'rechazado' | '';

interface DecisionFormModel {
  decision: DecisionValor;
  motivo: string;
}

const MOTIVO_MIN = 10;
const MOTIVO_MAX = 500;

const ESTADOS: Record<SolicitudDetalle['estado'], { etiqueta: string; variante: BadgeVariant }> = {
  PENDIENTE: { etiqueta: 'Pendiente de validación', variante: 'warning' },
  APROBADO: { etiqueta: 'Aprobada', variante: 'success' },
  RECHAZADO: { etiqueta: 'Rechazada', variante: 'danger' },
};

@Component({
  selector: 'app-revision-solicitud-auditor-page',
  imports: [
    ShellLayoutComponent,
    ButtonComponent,
    HeadingComponent,
    BadgeComponent,
    AvatarComponent,
    IconComponent,
    ModalComponent,
    TextareaComponent,
    DatePipe,
    FormField,
  ],
  templateUrl: './revision-solicitud-auditor-page.component.html',
  styleUrl: './revision-solicitud-auditor-page.component.scss',
})
export class RevisionSolicitudAuditorPageComponent implements OnInit {
  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'VALIDACIÓN',
    pageTitle: 'Revisión de solicitud',
    showNotificationDot: false,
    showBackButton: true,
  };

  readonly solicitudId = input.required<string>({ alias: 'id' });

  private readonly router = inject(Router);
  private readonly validacionService = inject(ValidacionService);
  private readonly toastService = inject(ToastService);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly solicitud = signal<SolicitudDetalle | null>(null);
  protected readonly documentoAbriendo = signal<string | null>(null);
  protected readonly confirmandoDecision = signal(false);
  protected readonly formatearTamanio = formatearTamanio;

  protected readonly model = signal<DecisionFormModel>({ decision: '', motivo: '' });

  protected readonly decisionForm = form(
    this.model,
    schema<DecisionFormModel>((path) => {
      required(path.decision, { message: 'Selecciona una decisión.' });
      validate(path.motivo, ({ value }) => {
        if (this.model().decision !== 'rechazado') return undefined;
        const largo = value().trim().length;
        if (largo === 0) {
          return { kind: 'motivoRequerido', message: 'Ingresa el motivo del rechazo.' };
        }
        if (largo < MOTIVO_MIN || largo > MOTIVO_MAX) {
          return {
            kind: 'motivoLargo',
            message: `El motivo debe tener entre ${MOTIVO_MIN} y ${MOTIVO_MAX} caracteres.`,
          };
        }
        return undefined;
      });
    })
  );

  protected readonly esRechazo = computed(() => this.model().decision === 'rechazado');
  protected readonly errorMotivo = computed(() => fieldError(this.decisionForm.motivo()));
  protected readonly enviando = computed(() => this.decisionForm().submitting());
  protected readonly motivoContador = computed(() => `${this.model().motivo.length}/${MOTIVO_MAX}`);
  protected readonly puedeConfirmar = computed(
    () => this.decisionForm().valid() && !this.enviando()
  );

  ngOnInit(): void {
    void this.cargarSolicitud();
  }

  protected async verDocumento(documentoId: string): Promise<void> {
    this.documentoAbriendo.set(documentoId);
    try {
      const resultado = await previsualizarBlobEnPestana(() =>
        firstValueFrom(this.validacionService.descargarDocumento(this.solicitudId(), documentoId))
      );
      if (resultado === 'bloqueada') {
        this.toastService.error(
          'El navegador bloqueó la ventana emergente. Permite ventanas emergentes e intenta de nuevo.'
        );
      }
    } catch (err: unknown) {
      this.toastService.error(
        'No se pudo abrir el documento',
        apiErrorMessage(err) ?? 'Intenta nuevamente.'
      );
    } finally {
      this.documentoAbriendo.set(null);
    }
  }

  protected seleccionarDecision(decision: DecisionValor): void {
    if (this.enviando()) return;
    this.model.update((m) => ({ ...m, decision }));
  }

  protected etiquetaEstado(estado: SolicitudDetalle['estado']): string {
    return ESTADOS[estado].etiqueta;
  }

  protected varianteEstado(estado: SolicitudDetalle['estado']): BadgeVariant {
    return ESTADOS[estado].variante;
  }

  protected hrefSitioWeb(sitioWeb: string): string {
    return /^https?:\/\//i.test(sitioWeb) ? sitioWeb : `https://${sitioWeb}`;
  }

  protected iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    if (!this.decisionForm().valid()) {
      this.decisionForm().markAsTouched();
      return;
    }
    this.confirmandoDecision.set(true);
  }

  protected cerrarConfirmacion(): void {
    if (!this.enviando()) {
      this.confirmandoDecision.set(false);
    }
  }

  protected async confirmarDecision(): Promise<void> {
    await submit(this.decisionForm, {
      action: async (field) => {
        const { decision, motivo } = field().value();
        if (!decision) return undefined;
        try {
          const resuelta = await firstValueFrom(
            this.validacionService.resolver(
              this.solicitudId(),
              decision,
              decision === 'rechazado' ? motivo.trim() : undefined
            )
          );
          this.confirmandoDecision.set(false);
          this.toastService.success(
            resuelta.estado === 'APROBADO' ? 'Solicitud aprobada' : 'Solicitud rechazada',
            'El auditor fue notificado por correo.'
          );
          await this.router.navigateByUrl('/admin/solicitudes-auditor');
        } catch (err: unknown) {
          this.confirmandoDecision.set(false);
          this.toastService.error(
            'No se pudo aplicar la decisión',
            apiErrorMessage(err) ?? 'Intenta nuevamente.'
          );
          if (err instanceof HttpErrorResponse && err.status === 409) {
            await this.router.navigateByUrl('/admin/solicitudes-auditor');
          }
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  private async cargarSolicitud(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const solicitud = await firstValueFrom(
        this.validacionService.obtenerDetalle(this.solicitudId())
      );
      this.solicitud.set(solicitud);
    } catch {
      this.errorCarga.set(true);
    } finally {
      this.cargando.set(false);
    }
  }
}
