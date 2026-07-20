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
import { FormField, form, schema, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { ToastHostComponent } from '../../../shared/components/toast/toast.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { EMAIL_MAX_LENGTH, EMAIL_MENSAJE, EMAIL_PATTERN } from '../../../shared/utils/email.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import {
  EstadoInvitacion,
  Invitacion,
  InvitacionesService,
} from '../../../core/invitaciones/invitaciones.service';

interface InvitacionFormModel {
  email: string;
}

const ESTADOS: Record<EstadoInvitacion, { etiqueta: string; variante: BadgeVariant }> = {
  ENVIADA: { etiqueta: 'Enviada', variante: 'info' },
  ACEPTADA: { etiqueta: 'Aceptada', variante: 'success' },
  EXPIRADA: { etiqueta: 'Expirada', variante: 'warning' },
  REVOCADA: { etiqueta: 'Revocada', variante: 'danger' },
};

@Component({
  selector: 'app-invitaciones-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    HeadingComponent,
    ShellLayoutComponent,
    TextInputComponent,
    ToastHostComponent,
    DatePipe,
    FormField,
  ],
  templateUrl: './invitaciones-page.component.html',
  styleUrl: './invitaciones-page.component.scss',
})
export class InvitacionesPageComponent {
  private readonly invitacionesService = inject(InvitacionesService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Invitaciones de empresa',
    showNotificationDot: true,
    userInitials: 'CA',
  };

  protected readonly invitaciones = signal<Invitacion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly invitacionARevocar = signal<Invitacion | null>(null);
  protected readonly revocando = signal(false);

  protected readonly model = signal<InvitacionFormModel>({ email: '' });

  protected readonly invitacionForm = form(
    this.model,
    schema<InvitacionFormModel>((path) => {
      validate(path.email, ({ value }) => {
        const email = value().trim();
        if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
          return { kind: 'email', message: EMAIL_MENSAJE };
        }
        return undefined;
      });
    })
  );

  protected readonly emailError = computed(() => fieldError(this.invitacionForm.email()));
  protected readonly enviando = computed(() => this.invitacionForm().submitting());

  private readonly modal = viewChild<ElementRef<HTMLElement>>('modalRevocar');

  constructor() {
    this.cargarInvitaciones();
    effect(() => {
      this.modal()?.nativeElement.focus();
    });
  }

  protected etiqueta(estado: EstadoInvitacion): string {
    return ESTADOS[estado]?.etiqueta ?? estado;
  }

  protected variante(estado: EstadoInvitacion): BadgeVariant {
    return ESTADOS[estado]?.variante ?? 'neutral';
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.enviar();
  }

  protected abrirRevocacion(invitacion: Invitacion): void {
    this.invitacionARevocar.set(invitacion);
  }

  protected cerrarRevocacion(): void {
    if (!this.revocando()) {
      this.invitacionARevocar.set(null);
    }
  }

  protected alPresionarTeclaModal(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cerrarRevocacion();
      return;
    }
    if (event.key === 'Tab') {
      this.atraparFoco(event);
    }
  }

  protected reintentarCarga(): void {
    this.cargarInvitaciones();
  }

  protected confirmarRevocacion(): void {
    const invitacion = this.invitacionARevocar();
    if (!invitacion || this.revocando()) {
      return;
    }
    this.revocando.set(true);
    this.invitacionesService
      .revocar(invitacion.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (revocada) => {
          this.revocando.set(false);
          this.invitacionARevocar.set(null);
          this.invitaciones.update((lista) =>
            lista.map((i) => (i.id === revocada.id ? revocada : i))
          );
          this.toastService.success(`Invitación a ${revocada.email} revocada.`);
        },
        error: (err: HttpErrorResponse) => {
          this.revocando.set(false);
          this.invitacionARevocar.set(null);
          this.toastService.error(
            apiErrorMessage(err) ?? 'No pudimos revocar la invitación. Intenta nuevamente.'
          );
        },
      });
  }

  private async enviar(): Promise<void> {
    await submit(this.invitacionForm, {
      action: async (field) => {
        const email = field().value().email.trim();
        try {
          const invitacion = await firstValueFrom(this.invitacionesService.emitir(email));
          this.model.set({ email: '' });
          this.invitacionForm().reset();
          this.invitaciones.update((lista) => [invitacion, ...lista]);
          this.toastService.success(`Invitación enviada a ${invitacion.email}.`);
        } catch (err: unknown) {
          this.toastService.error(
            apiErrorMessage(err) ?? 'No pudimos enviar la invitación. Intenta nuevamente.'
          );
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

  private cargarInvitaciones(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.invitacionesService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.invitaciones.set(lista);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.errorCarga.set(true);
        },
      });
  }
}
