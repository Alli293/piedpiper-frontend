import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, firstValueFrom } from 'rxjs';
import { form, FormField, schema, validate } from '@angular/forms/signals';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CheckboxComponent } from '../../shared/components/inputs/checkbox/checkbox.component';
import { TextareaComponent } from '../../shared/components/inputs/textarea/textarea.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { ToastService } from '../../shared/services/toast.service';
import { PerfilAuditorService } from '../../core/perfil-auditor/perfil-auditor.service';
import { AuthSessionService } from '../../core/auth-session.service';
import { ActualizarPerfilRequest } from '../../core/models/perfil-auditor.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { fieldError } from '../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';

interface PerfilAuditorFormModel {
  descripcionProfesional: string;
  disponible: boolean;
}

const MAX_ESPECIALIDADES = 8;
const MAX_DESCRIPCION = 500;

@Component({
  selector: 'app-perfil-auditor-page',
  imports: [
    FormField,
    ShellLayoutComponent,
    ButtonComponent,
    CheckboxComponent,
    TextareaComponent,
    AvatarComponent,
    BadgeComponent,
    HeadingComponent,
  ],
  templateUrl: './perfil-auditor-page.component.html',
  styleUrl: './perfil-auditor-page.component.scss',
})
export class PerfilAuditorPageComponent implements OnInit {
  private readonly perfilAuditorService = inject(PerfilAuditorService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  protected readonly cargandoCatalogos = signal(true);
  protected readonly errorCatalogos = signal(false);
  protected readonly errorCarga = signal(false);
  protected readonly especialidades = signal<CatalogoItem[]>([]);
  protected readonly zonasCobertura = signal<CatalogoItem[]>([]);

  // Multi-select state (arrays managed via signals, not form model)
  protected readonly especialidadesSeleccionadas = signal<string[]>([]);
  protected readonly zonasSeleccionadas = signal<string[]>([]);
  protected readonly especialidadesTocado = signal(false);
  protected readonly zonasTocado = signal(false);

  // Form model for primitive fields
  protected readonly model = signal<PerfilAuditorFormModel>({
    descripcionProfesional: '',
    disponible: true,
  });

  protected readonly perfilForm = form(
    this.model,
    schema<PerfilAuditorFormModel>((path) => {
      validate(path.descripcionProfesional, ({ value }) => {
        if (value().length > MAX_DESCRIPCION) {
          return {
            kind: 'descripcionMuyLarga',
            message: 'La descripción no puede superar los 500 caracteres.',
          };
        }
        return undefined;
      });
    })
  );

  // Validation errors for multi-select fields
  protected readonly errorEspecialidades = computed(() => {
    if (!this.especialidadesTocado()) return '';
    const seleccionadas = this.especialidadesSeleccionadas();
    if (seleccionadas.length === 0) {
      return 'Seleccione al menos una especialidad.';
    }
    if (seleccionadas.length > MAX_ESPECIALIDADES) {
      return 'Puede seleccionar un máximo de 8 especialidades.';
    }
    return '';
  });

  protected readonly errorZonas = computed(() => {
    if (!this.zonasTocado()) return '';
    const seleccionadas = this.zonasSeleccionadas();
    if (seleccionadas.length === 0) {
      return 'Seleccione al menos una zona de cobertura.';
    }
    return '';
  });

  protected readonly errorDescripcion = computed(() =>
    fieldError(this.perfilForm.descripcionProfesional())
  );

  protected readonly descripcionContador = computed(
    () => `${this.model().descripcionProfesional.length}/${MAX_DESCRIPCION}`
  );

  // Overall form validity (combines signal form + array validations).
  // NOTE: The descripcion length check here is intentionally redundant with the form schema
  // validation. formularioInvalido() must work independently of whether fields are touched/dirty,
  // while the schema validation only fires when the field is dirty.
  protected readonly formularioInvalido = computed(() => {
    const especialidades = this.especialidadesSeleccionadas();
    const zonas = this.zonasSeleccionadas();
    const descripcion = this.model().descripcionProfesional;

    const especialidadesInvalidas =
      especialidades.length === 0 || especialidades.length > MAX_ESPECIALIDADES;
    const zonasInvalidas = zonas.length === 0;
    const descripcionInvalida = descripcion.length > MAX_DESCRIPCION;

    return especialidadesInvalidas || zonasInvalidas || descripcionInvalida;
  });

  protected readonly formularioBloqueado = computed(
    () => this.cargandoCatalogos() || this.errorCatalogos()
  );

  protected readonly guardando = signal(false);

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'PERFIL AUDITOR',
    pageTitle: 'Mi Perfil de Auditor',
    showNotificationDot: false,
    userInitials: this.userInitials(),
  }));

  // Display-only signals for profile header card
  protected readonly userInitials = computed(() => this.authSessionService.getUserInitials());
  protected readonly userName = computed(() => {
    const name = this.authSessionService.getUserName();
    return name || 'Auditor';
  });
  protected readonly userEmail = computed(() => this.authSessionService.getUserEmail());
  ngOnInit(): void {
    void this.cargarDatosIniciales();
  }

  protected toggleEspecialidad(valor: string): void {
    this.especialidadesTocado.set(true);
    this.especialidadesSeleccionadas.update((seleccionadas) => {
      if (seleccionadas.includes(valor)) {
        return seleccionadas.filter((v) => v !== valor);
      }
      return [...seleccionadas, valor];
    });
  }

  protected toggleZona(valor: string): void {
    this.zonasTocado.set(true);
    this.zonasSeleccionadas.update((seleccionadas) => {
      if (seleccionadas.includes(valor)) {
        return seleccionadas.filter((v) => v !== valor);
      }
      return [...seleccionadas, valor];
    });
  }

  protected isEspecialidadSeleccionada(valor: string): boolean {
    return this.especialidadesSeleccionadas().includes(valor);
  }

  protected isZonaSeleccionada(valor: string): boolean {
    return this.zonasSeleccionadas().includes(valor);
  }

  protected async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.errorCarga()) {
      this.toastService.error(
        'Recarga la página para cargar tu perfil antes de guardar.',
        undefined,
        5000
      );
      return;
    }

    // Mark multi-select fields as touched on submit attempt
    this.especialidadesTocado.set(true);
    this.zonasTocado.set(true);
    this.perfilForm.descripcionProfesional().markAsTouched();

    if (this.formularioInvalido()) {
      return;
    }

    const auditorId = this.authSessionService.getUserId();
    if (!auditorId) {
      this.toastService.error('No se pudo identificar al usuario. Inicie sesión nuevamente.');
      return;
    }

    const dto: ActualizarPerfilRequest = {
      especialidades: this.especialidadesSeleccionadas(),
      zonasCobertura: this.zonasSeleccionadas(),
      disponible: this.model().disponible,
      descripcionProfesional: this.model().descripcionProfesional || null,
    };

    this.guardando.set(true);

    try {
      await firstValueFrom(this.perfilAuditorService.actualizarPerfil(auditorId, dto));
      this.toastService.success('Perfil actualizado correctamente.', undefined, 5000);
    } catch (err: unknown) {
      this.manejarErrorGuardado(err);
    } finally {
      this.guardando.set(false);
    }
  }

  private manejarErrorGuardado(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 403) {
      const mensaje = apiErrorMessage(error) ?? 'No tiene permiso para editar este perfil.';
      this.toastService.error(mensaje);
      return;
    }

    this.toastService.error('No se pudo guardar el perfil. Intente nuevamente.');
  }

  private async cargarDatosIniciales(): Promise<void> {
    this.cargandoCatalogos.set(true);
    this.errorCatalogos.set(false);

    try {
      const { especialidades, zonas } = await firstValueFrom(
        forkJoin({
          especialidades: this.perfilAuditorService.obtenerEspecialidades(),
          zonas: this.perfilAuditorService.obtenerZonasCobertura(),
        })
      );
      this.especialidades.set(especialidades);
      this.zonasCobertura.set(zonas);
      this.cargandoCatalogos.set(false);

      // After catalogs loaded, try to load existing profile
      await this.cargarPerfilExistente();
    } catch {
      this.cargandoCatalogos.set(false);
      this.errorCatalogos.set(true);
      this.toastService.error('No se pudo cargar el catálogo. Intente recargar la página.');
    }
  }

  private async cargarPerfilExistente(): Promise<void> {
    const auditorId = this.authSessionService.getUserId();
    if (!auditorId) return;

    try {
      const perfil = await firstValueFrom(this.perfilAuditorService.obtenerPerfil(auditorId));
      this.especialidadesSeleccionadas.set(perfil.especialidades);
      this.zonasSeleccionadas.set(perfil.zonasCobertura);
      this.model.set({
        descripcionProfesional: perfil.descripcionProfesional ?? '',
        disponible: perfil.disponible,
      });
    } catch (err: unknown) {
      // 404 means no profile exists yet — leave form empty (first-time setup)
      if (err instanceof HttpErrorResponse && err.status === 404) {
        return;
      }
      // Non-404 errors block the form to prevent overwriting data
      this.errorCarga.set(true);
      this.toastService.error(
        'No se pudo cargar tu perfil. Intenta recargar la página.',
        undefined,
        5000
      );
    }
  }
}
