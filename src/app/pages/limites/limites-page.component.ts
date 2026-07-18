import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { disabled, form, FormField, maxLength, schema, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { TextareaComponent } from '../../shared/components/inputs/textarea/textarea.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  HeaderConfig,
  PageLayoutComponent,
  SidebarConfig,
} from '../../shared/layouts/page-layout/page-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { LimiteEmisionesRequest, LimiteEmisionesResponse, LimitesService } from './limites.service';

interface LimitesFormModel {
  anio: string;
  limiteMt: string;
  justificacion: string;
}

@Component({
  selector: 'app-limites-page',
  imports: [
    DatePipe,
    FormField,
    PageLayoutComponent,
    SelectInputComponent,
    TextInputComponent,
    TextareaComponent,
    HeadingComponent,
    IconComponent,
    ButtonComponent,
  ],
  templateUrl: './limites-page.component.html',
  styleUrl: './limites-page.component.scss',
})
export class LimitesPageComponent {
  private readonly limitesService = inject(LimitesService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly loading = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly deletingYear = signal<number | null>(null);
  protected readonly confirmDeleteYear = signal<number | null>(null);
  protected readonly editingYear = signal<number | null>(null);
  protected readonly limiteVigente = signal<LimiteEmisionesResponse | null>(null);
  protected readonly limites = signal<LimiteEmisionesResponse[]>([]);
  protected readonly isAdmin = computed(() => this.authSession.isAdministradorEmpresa());
  protected readonly isEditing = computed(() => this.editingYear() !== null);

  protected readonly model = signal<LimitesFormModel>({
    anio: String(this.currentYear),
    limiteMt: '',
    justificacion: '',
  });

  protected readonly limitesForm = form(
    this.model,
    schema<LimitesFormModel>((path) => {
      validate(path.anio, ({ value }) => {
        const anio = Number(value());
        if (!Number.isInteger(anio) || anio < 2000 || anio > this.currentYear + 1) {
          return { kind: 'anioValido', message: 'Seleccione un año válido.' };
        }
        return undefined;
      });
      disabled(path.anio, { when: () => this.isEditing() });

      validate(path.limiteMt, ({ value }) => {
        const limiteMt = value().trim();
        if (!/^\d{1,12}(\.\d{1,4})?$/.test(limiteMt) || Number(limiteMt) <= 0) {
          return { kind: 'limiteMt', message: 'Ingrese un límite mayor que 0.' };
        }
        return undefined;
      });

      maxLength(path.justificacion, 500, {
        message: 'La justificación no puede superar 500 caracteres.',
      });
    })
  );

  protected readonly anioError = computed(() => this.fieldError(this.limitesForm.anio()));
  protected readonly limiteMtError = computed(() => this.fieldError(this.limitesForm.limiteMt()));
  protected readonly justificacionError = computed(() =>
    this.fieldError(this.limitesForm.justificacion())
  );

  protected readonly submitting = computed(() => this.limitesForm().submitting());
  protected readonly canSubmit = computed(() => this.limitesForm().valid() && !this.submitting());

  protected readonly yearOptions: SelectOption[] = Array.from(
    { length: this.currentYear + 2 - 2000 },
    (_, index) => {
      const year = 2000 + index;
      return { value: String(year), label: String(year) };
    }
  ).reverse();

  protected readonly sidebarConfig = computed<SidebarConfig>(() => {
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' as const, active: false },
      { id: 'emissions', label: 'Mis emisiones', icon: 'emisiones' as const, active: false },
      { id: 'limits', label: 'Límite anual', icon: 'benchmark' as const, active: true },
      { id: 'team-members', label: 'Colaboradores', icon: 'colaboradores' as const, active: false },
    ].filter((item) => item.id !== 'limits' || this.isAdmin());

    return {
      menuItems,
      bottomItems: [
        { id: 'settings', label: 'Configuración', icon: 'config' },
        { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
      ],
      companyName: 'Café del Valle S.A.',
      companyRole: this.isAdmin() ? 'Administrador' : 'Usuario general',
      companyInitials: 'CV',
    };
  });

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Límite anual de emisiones',
    showNotificationDot: true,
    userInitials: 'CA',
  };

  constructor() {
    if (this.isAdmin()) {
      this.cargarLimites();
    }

    effect(() => {
      const anioField = this.limitesForm.anio();
      const anio = anioField.value();
      if (anioField.valid() && !this.isEditing()) {
        this.precargarLimite(Number(anio));
      }
    });
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.guardar();
  }

  protected editar(limite: LimiteEmisionesResponse): void {
    this.editingYear.set(limite.anio);
    this.confirmDeleteYear.set(null);
    this.model.update((m) => ({
      ...m,
      anio: String(limite.anio),
      limiteMt: formatDecimal(limite.limiteMt),
      justificacion: limite.justificacion ?? '',
    }));
    this.limiteVigente.set(limite);
  }

  protected cancelarEdicion(): void {
    this.salirModoEdicion(true);
  }

  protected solicitarEliminar(anio: number): void {
    this.confirmDeleteYear.set(anio);
  }

  protected cancelarEliminar(): void {
    this.confirmDeleteYear.set(null);
  }

  protected eliminar(anio: number): void {
    if (this.deletingYear() !== null) return;

    this.deletingYear.set(anio);
    this.limitesService
      .eliminarLimite(anio)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingYear.set(null);
          this.confirmDeleteYear.set(null);
          this.toastService.success(`Límite del año ${anio} eliminado.`);

          if (this.editingYear() === anio || Number(this.model().anio) === anio) {
            this.salirModoEdicion(true);
          }
          this.cargarLimites();
        },
        error: (error: HttpErrorResponse) => {
          this.deletingYear.set(null);
          if (error.status === 403) {
            this.toastService.error(
              this.mensajeApi(error) ?? 'No tiene permiso para modificar el límite de la empresa.'
            );
            return;
          }
          this.toastService.error('No se pudo eliminar el límite. Intente nuevamente.');
        },
      });
  }

  protected formatLimite(value: number): string {
    return new Intl.NumberFormat('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(value);
  }

  protected cargarLimites(): void {
    this.loadingList.set(true);
    this.limitesService
      .listarLimites()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (limites) => {
          this.limites.set(limites);
          this.loadingList.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loadingList.set(false);
          if (error.status !== 403) {
            this.toastService.error('No se pudieron cargar los límites.');
          }
        },
      });
  }

  private async guardar(): Promise<void> {
    if (!this.isAdmin()) {
      this.toastService.error('No tiene permiso para modificar el límite de la empresa.');
      return;
    }

    await submit(this.limitesForm, {
      action: async (field) => {
        const value = field().value();
        const request: LimiteEmisionesRequest = {
          anio: Number(value.anio),
          limiteMt: Number(value.limiteMt),
          justificacion: value.justificacion.trim() || null,
        };

        try {
          const response = await firstValueFrom(this.limitesService.guardarLimite(request));
          this.limiteVigente.set(response);
          this.model.update((m) => ({
            ...m,
            limiteMt: formatDecimal(response.limiteMt),
            justificacion: response.justificacion ?? '',
          }));
          const accion = response.recienCreada ? 'creado' : 'actualizado';
          this.toastService.success(
            `Límite del año ${response.anio} ${accion}: ${formatDecimal(response.limiteMt)} t CO₂e.`
          );
          this.salirModoEdicion(false);
          this.cargarLimites();
        } catch (error) {
          this.manejarErrorGuardado(error, request.anio);
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  private precargarLimite(anio: number): void {
    if (!this.isAdmin()) return;

    this.loading.set(true);
    this.limitesService
      .obtenerLimite(anio)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.limiteVigente.set(response);
          this.model.update((m) => ({
            ...m,
            limiteMt: formatDecimal(response.limiteMt),
            justificacion: response.justificacion ?? '',
          }));
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          if (error.status === 404) {
            this.limiteVigente.set(null);
            this.model.update((m) => ({ ...m, limiteMt: '', justificacion: '' }));
            return;
          }
          if (error.status !== 403) {
            this.toastService.error('No se pudo cargar el límite. Intente nuevamente.');
          }
        },
      });
  }

  private salirModoEdicion(recargarSeleccion: boolean): void {
    this.editingYear.set(null);

    if (recargarSeleccion) {
      this.model.update((m) => ({ ...m, anio: String(this.currentYear), justificacion: '' }));
    }
  }

  private manejarErrorGuardado(error: unknown, anio: number): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        this.toastService.error(
          this.mensajeApi(error) ?? 'No tiene permiso para modificar el límite de la empresa.'
        );
        return;
      }

      if (error.status === 409) {
        this.toastService.error(
          this.mensajeApi(error) ?? 'Conflicto al guardar el límite. Intente nuevamente.'
        );
        this.precargarLimite(anio);
        this.cargarLimites();
        return;
      }
    }

    this.toastService.error('No se pudo guardar el límite. Intente nuevamente.');
  }

  private mensajeApi(error: HttpErrorResponse): string | undefined {
    const apiError = error.error as { message?: string } | null;
    return apiError?.message ?? undefined;
  }

  private fieldError(field: {
    touched(): boolean;
    errors(): readonly { message?: string }[];
  }): string {
    if (!field.touched()) return '';
    return field.errors()[0]?.message ?? '';
  }
}

function formatDecimal(value: number): string {
  return Number(value).toString();
}
