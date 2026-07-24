import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, required, schema, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { RadioGroupFieldComponent } from '../../../shared/components/inputs/radio-group-field/radio-group-field.component';
import { SelectOption } from '../../../shared/components/inputs/select-input/select-input.component';
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import { ToastService } from '../../../shared/services/toast.service';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import {
  PaginaSolicitudes,
  SolicitudPendiente,
  ValidacionService,
} from '../../../core/validacion/validacion.service';

type DecisionValor = 'aprobado' | 'rechazado' | '';

interface DecisionFormModel {
  decision: DecisionValor;
  motivo: string;
}

const MOTIVO_MIN = 10;
const MOTIVO_MAX = 500;

@Component({
  selector: 'app-solicitudes-auditor-page',
  imports: [ButtonComponent, RadioGroupFieldComponent, TextareaComponent, DatePipe, FormField],
  templateUrl: './solicitudes-auditor-page.component.html',
  styleUrl: './solicitudes-auditor-page.component.scss',
})
export class SolicitudesAuditorPageComponent {
  private readonly validacionService = inject(ValidacionService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly pagina = signal<PaginaSolicitudes | null>(null);
  protected readonly solicitudEnRevision = signal<SolicitudPendiente | null>(null);

  protected readonly model = signal<DecisionFormModel>({ decision: '', motivo: '' });

  protected readonly decisionForm = form(
    this.model,
    schema<DecisionFormModel>((path) => {
      required(path.decision, { message: 'Selecciona una decisión.' });
      validate(path.motivo, ({ value }) => {
        if (this.model().decision !== 'rechazado') {
          return undefined;
        }
        const largo = value().trim().length;
        if (largo === 0) {
          return { kind: 'motivoRequerido', message: 'Ingresa el motivo del rechazo.' };
        }
        if (largo < MOTIVO_MIN || largo > MOTIVO_MAX) {
          return {
            kind: 'motivoLargo',
            message: 'El motivo debe tener entre 10 y 500 caracteres.',
          };
        }
        return undefined;
      });
    })
  );

  protected readonly decisionOptions: SelectOption[] = [
    { value: 'aprobado', label: 'Aprobar' },
    { value: 'rechazado', label: 'Rechazar' },
  ];

  protected readonly esRechazo = computed(() => this.model().decision === 'rechazado');
  protected readonly errorMotivo = computed(() => fieldError(this.decisionForm.motivo()));
  protected readonly enviando = computed(() => this.decisionForm().submitting());
  protected readonly puedeConfirmar = computed(
    () => this.decisionForm().valid() && !this.enviando()
  );

  private readonly modal = viewChild<ElementRef<HTMLElement>>('modalRevision');

  constructor() {
    this.cargar(0);
    effect(() => {
      this.modal()?.nativeElement.focus();
    });
  }

  protected cargar(numeroPagina: number): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.validacionService
      .listarPendientes(numeroPagina)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pagina) => {
          this.pagina.set(pagina);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.errorCarga.set(true);
          this.toastService.error(
            'No pudimos cargar las solicitudes',
            apiErrorMessage(err) ?? 'Intenta nuevamente.'
          );
        },
      });
  }

  protected abrirRevision(solicitud: SolicitudPendiente): void {
    this.solicitudEnRevision.set(solicitud);
    this.model.set({ decision: '', motivo: '' });
    this.decisionForm().reset();
  }

  protected cerrarRevision(): void {
    if (!this.enviando()) {
      this.solicitudEnRevision.set(null);
    }
  }

  protected alPresionarTeclaModal(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cerrarRevision();
      return;
    }
    if (event.key === 'Tab') {
      this.atraparFoco(event);
    }
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.confirmarDecision();
  }

  protected async confirmarDecision(): Promise<void> {
    const solicitud = this.solicitudEnRevision();
    if (!solicitud || this.enviando()) {
      return;
    }
    await submit(this.decisionForm, {
      action: async (field) => {
        const { decision, motivo } = field().value();
        if (!decision) {
          return undefined;
        }
        try {
          const resuelta = await firstValueFrom(
            this.validacionService.resolver(
              solicitud.id,
              decision,
              decision === 'rechazado' ? motivo.trim() : undefined
            )
          );
          this.solicitudEnRevision.set(null);
          this.toastService.success(
            resuelta.estado === 'APROBADO' ? 'Solicitud aprobada' : 'Solicitud rechazada',
            `El auditor ${solicitud.nombreAuditor} fue notificado por correo.`
          );
          this.cargar(this.paginaTrasResolver());
        } catch (err: unknown) {
          this.solicitudEnRevision.set(null);
          this.toastService.error(
            'No se pudo aplicar la decisión',
            apiErrorMessage(err) ?? 'Intenta nuevamente.'
          );
          if (err instanceof HttpErrorResponse && err.status === 409) {
            this.cargar(this.paginaTrasResolver());
          }
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  private atraparFoco(event: KeyboardEvent): void {
    const modal = this.modal()?.nativeElement;
    if (!modal) {
      return;
    }
    const focusables = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) {
      return;
    }
    const primero = focusables[0];
    const ultimo = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }

  private paginaTrasResolver(): number {
    const actual = this.pagina();
    const paginaActual = actual?.pagina ?? 0;
    const esUltimaDeLaPagina = (actual?.contenido.length ?? 0) <= 1;
    return esUltimaDeLaPagina && paginaActual > 0 ? paginaActual - 1 : paginaActual;
  }
}
