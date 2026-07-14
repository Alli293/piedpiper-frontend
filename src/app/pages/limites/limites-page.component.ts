import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { distinctUntilChanged, filter, Observable } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { ToastService } from '../../core/toast.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { TextareaComponent } from '../../shared/components/inputs/textarea/textarea.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  HeaderConfig,
  PageLayoutComponent,
  SidebarConfig,
} from '../../shared/layouts/page-layout/page-layout.component';
import {
  LimiteEmisionesRequest,
  LimiteEmisionesResponse,
  LimitesService,
} from './limites.service';

@Component({
  selector: 'app-limites-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageLayoutComponent,
    SelectInputComponent,
    TextInputComponent,
    TextareaComponent,
    IconComponent,
    ButtonComponent,
  ],
  templateUrl: './limites-page.component.html',
  styleUrl: './limites-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LimitesPageComponent {
  private readonly limitesService = inject(LimitesService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly deletingYear = signal<number | null>(null);
  protected readonly confirmDeleteYear = signal<number | null>(null);
  protected readonly editingYear = signal<number | null>(null);
  protected readonly submitted = signal(false);
  protected readonly limiteVigente = signal<LimiteEmisionesResponse | null>(null);
  protected readonly limites = signal<LimiteEmisionesResponse[]>([]);
  protected readonly toastMessage = this.toastService.message;
  protected readonly isAdmin = computed(() => this.authSession.isAdministradorEmpresa());
  protected readonly isEditing = computed(() => this.editingYear() !== null);

  protected readonly anioControl = new FormControl(String(this.currentYear), {
    nonNullable: true,
    validators: [Validators.required, this.anioValidoValidator.bind(this)],
  });

  protected readonly limiteMtControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, limiteMtValidator],
  });

  protected readonly justificacionControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(500)],
  });

  protected readonly form = new FormGroup({
    anio: this.anioControl,
    limiteMt: this.limiteMtControl,
    justificacion: this.justificacionControl,
  });

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
      this.precargarLimite(Number(this.anioControl.value));
    }

    this.anioControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        filter(() => this.anioControl.valid && !this.isEditing()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value) => this.precargarLimite(Number(value)));
  }

  protected get anioError(): string {
    if (!this.debeMostrarError(this.anioControl)) return '';
    return 'Seleccione un año válido.';
  }

  protected get limiteMtError(): string {
    if (!this.debeMostrarError(this.limiteMtControl)) return '';
    return 'Ingrese un límite mayor que 0.';
  }

  protected get justificacionError(): string {
    if (!this.debeMostrarError(this.justificacionControl)) return '';
    return 'La justificación no puede superar 500 caracteres.';
  }

  protected guardar(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (!this.isAdmin()) {
      this.toastService.show('No tiene permiso para modificar el límite de la empresa.');
      return;
    }

    if (this.form.invalid || this.saving()) {
      return;
    }

    const request: LimiteEmisionesRequest = {
      anio: Number(this.anioControl.value),
      limiteMt: Number(this.limiteMtControl.value),
      justificacion: this.justificacionControl.value.trim() || null,
    };
    const operation: Observable<LimiteEmisionesResponse> = this.isEditing()
      ? this.limitesService.actualizarLimite(request)
      : this.limitesService.guardarLimite(request);

    this.saving.set(true);
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.limiteVigente.set(response);
        this.limiteMtControl.setValue(formatDecimal(response.limiteMt), { emitEvent: false });
        this.justificacionControl.setValue(response.justificacion ?? '', { emitEvent: false });
        this.toastService.show(
          `Límite del año ${response.anio} guardado: ${formatDecimal(response.limiteMt)} t CO₂e.`
        );
        this.saving.set(false);
        this.salirModoEdicion(false);
        this.cargarLimites();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.manejarErrorGuardado(error, request.anio);
      },
    });
  }

  protected editar(limite: LimiteEmisionesResponse): void {
    this.editingYear.set(limite.anio);
    this.submitted.set(false);
    this.confirmDeleteYear.set(null);
    this.anioControl.setValue(String(limite.anio), { emitEvent: false });
    this.anioControl.disable({ emitEvent: false });
    this.limiteMtControl.setValue(formatDecimal(limite.limiteMt), { emitEvent: false });
    this.justificacionControl.setValue(limite.justificacion ?? '', { emitEvent: false });
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
          this.toastService.show(`Límite del año ${anio} eliminado.`);

          if (this.editingYear() === anio || Number(this.anioControl.value) === anio) {
            this.salirModoEdicion(true);
          }
          this.cargarLimites();
        },
        error: (error: HttpErrorResponse) => {
          this.deletingYear.set(null);
          if (error.status === 403) {
            this.toastService.show('No tiene permiso para modificar el límite de la empresa.');
            return;
          }
          this.toastService.show('No se pudo eliminar el límite. Intente nuevamente.');
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
            this.toastService.show('No se pudieron cargar los límites.');
          }
        },
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
          this.limiteMtControl.setValue(formatDecimal(response.limiteMt), { emitEvent: false });
          this.justificacionControl.setValue(response.justificacion ?? '', { emitEvent: false });
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          if (error.status === 404) {
            this.limiteVigente.set(null);
            this.limiteMtControl.setValue('', { emitEvent: false });
            this.justificacionControl.setValue('', { emitEvent: false });
          }
        },
      });
  }

  private salirModoEdicion(recargarSeleccion: boolean): void {
    this.editingYear.set(null);
    this.submitted.set(false);
    this.anioControl.enable({ emitEvent: false });

    if (recargarSeleccion) {
      this.anioControl.setValue(String(this.currentYear), { emitEvent: false });
      this.justificacionControl.setValue('', { emitEvent: false });
      this.precargarLimite(this.currentYear);
    }
  }

  private manejarErrorGuardado(error: HttpErrorResponse, anio: number): void {
    if (error.status === 403) {
      this.toastService.show('No tiene permiso para modificar el límite de la empresa.');
      return;
    }

    if (error.status === 409) {
      this.toastService.show('Ya existe un límite para ese año; se actualizó el valor.');
      this.precargarLimite(anio);
      this.cargarLimites();
      return;
    }

    this.toastService.show('No se pudo guardar el límite. Intente nuevamente.');
  }

  private debeMostrarError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitted());
  }

  private anioValidoValidator(control: AbstractControl<string>): ValidationErrors | null {
    const value = Number(control.value);
    if (!Number.isInteger(value) || value < 2000 || value > this.currentYear + 1) {
      return { anioValido: true };
    }
    return null;
  }
}

function limiteMtValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value.trim();
  if (!/^\d+(\.\d{1,4})?$/.test(value)) {
    return { limiteMt: true };
  }

  return Number(value) > 0 ? null : { limiteMt: true };
}

function formatDecimal(value: number): string {
  return Number(value).toString();
}
