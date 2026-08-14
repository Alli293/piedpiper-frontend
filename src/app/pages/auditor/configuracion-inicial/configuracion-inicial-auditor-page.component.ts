import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  disabled,
  form,
  FormField,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { ConfiguracionInicialLayoutComponent } from '../../../shared/layouts/configuracion-inicial-layout/configuracion-inicial-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import { FileDropComponent } from '../../../shared/components/inputs/file-drop/file-drop.component';
import { ToastService } from '../../../shared/services/toast.service';
import { PerfilAuditorService } from '../../../core/perfil-auditor/perfil-auditor.service';
import { CatalogoItem } from '../../../core/models/catalogo.model';
import { ConfiguracionInicialAuditorService } from '../../../core/auditor/configuracion-inicial-auditor.service';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';

const MAX_DESCRIPCION = 500;
const MAX_SITIO_WEB = 300;
const MAX_ESPECIALIDADES = 8;

interface ConfiguracionInicialAuditorFormModel {
  aniosExperiencia: string;
  sitioWeb: string;
  descripcionProfesional: string;
}

const INITIAL_MODEL: ConfiguracionInicialAuditorFormModel = {
  aniosExperiencia: '',
  sitioWeb: '',
  descripcionProfesional: '',
};

@Component({
  selector: 'app-configuracion-inicial-auditor-page',
  imports: [
    FormField,
    ConfiguracionInicialLayoutComponent,
    ButtonComponent,
    HeadingComponent,
    TextInputComponent,
    TextareaComponent,
    CheckboxComponent,
    FileDropComponent,
  ],
  templateUrl: './configuracion-inicial-auditor-page.component.html',
  styleUrl: './configuracion-inicial-auditor-page.component.scss',
})
export class ConfiguracionInicialAuditorPageComponent implements OnInit {
  private readonly perfilAuditorService = inject(PerfilAuditorService);
  private readonly configuracionInicialAuditorService = inject(ConfiguracionInicialAuditorService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly cargandoCatalogo = signal(true);
  protected readonly errorCatalogo = signal(false);
  protected readonly especialidadesDisponibles = signal<CatalogoItem[]>([]);

  protected readonly especialidadesSeleccionadas = signal<string[]>([]);
  protected readonly especialidadesTocado = signal(false);

  protected readonly documentos = signal<File[]>([]);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal('');

  protected readonly model = signal<ConfiguracionInicialAuditorFormModel>({ ...INITIAL_MODEL });

  protected readonly configuracionForm = form(
    this.model,
    schema<ConfiguracionInicialAuditorFormModel>((path) => {
      required(path.aniosExperiencia, { message: 'Indica tus años de experiencia.' });
      validate(path.aniosExperiencia, ({ value }) => {
        const raw = value();
        if (!raw.trim()) return undefined;
        const anios = Number(raw);
        if (!Number.isInteger(anios) || anios < 0 || anios > 60) {
          return {
            kind: 'aniosExperienciaInvalidos',
            message: 'Ingresa un número de años de experiencia válido.',
          };
        }
        return undefined;
      });

      validate(path.sitioWeb, ({ value }) => {
        if (value().length > MAX_SITIO_WEB) {
          return {
            kind: 'sitioWebMuyLargo',
            message: `El enlace no puede superar los ${MAX_SITIO_WEB} caracteres.`,
          };
        }
        return undefined;
      });

      validate(path.descripcionProfesional, ({ value }) => {
        if (value().length > MAX_DESCRIPCION) {
          return {
            kind: 'descripcionMuyLarga',
            message: `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres.`,
          };
        }
        return undefined;
      });

      disabled(path.aniosExperiencia, { when: () => this.enviando() });
      disabled(path.sitioWeb, { when: () => this.enviando() });
      disabled(path.descripcionProfesional, { when: () => this.enviando() });
    })
  );

  protected readonly errorAniosExperiencia = computed(() =>
    fieldError(this.configuracionForm.aniosExperiencia())
  );
  protected readonly errorSitioWeb = computed(() => fieldError(this.configuracionForm.sitioWeb()));
  protected readonly errorDescripcion = computed(() =>
    fieldError(this.configuracionForm.descripcionProfesional())
  );
  protected readonly descripcionContador = computed(
    () => `${this.model().descripcionProfesional.length}/${MAX_DESCRIPCION}`
  );

  protected readonly maxEspecialidadesAlcanzado = computed(
    () => this.especialidadesSeleccionadas().length >= MAX_ESPECIALIDADES
  );

  protected readonly errorEspecialidades = computed(() => {
    if (!this.especialidadesTocado()) return '';
    const seleccionadas = this.especialidadesSeleccionadas();
    if (seleccionadas.length === 0) return 'Selecciona al menos una especialidad.';
    if (seleccionadas.length > MAX_ESPECIALIDADES) {
      return `Puedes seleccionar un máximo de ${MAX_ESPECIALIDADES} especialidades.`;
    }
    return '';
  });

  protected readonly submitting = computed(() => this.configuracionForm().submitting());

  ngOnInit(): void {
    void this.cargarCatalogo();
  }

  protected toggleEspecialidad(valor: string): void {
    this.especialidadesTocado.set(true);
    this.especialidadesSeleccionadas.update((seleccionadas) => {
      if (seleccionadas.includes(valor)) {
        return seleccionadas.filter((v) => v !== valor);
      }
      if (seleccionadas.length >= MAX_ESPECIALIDADES) {
        return seleccionadas;
      }
      return [...seleccionadas, valor];
    });
  }

  protected isEspecialidadSeleccionada(valor: string): boolean {
    return this.especialidadesSeleccionadas().includes(valor);
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private async cargarCatalogo(): Promise<void> {
    this.cargandoCatalogo.set(true);
    this.errorCatalogo.set(false);
    try {
      const especialidades = await firstValueFrom(
        this.perfilAuditorService.obtenerEspecialidades()
      );
      this.especialidadesDisponibles.set(especialidades);
    } catch {
      this.errorCatalogo.set(true);
    } finally {
      this.cargandoCatalogo.set(false);
    }
  }

  private async onSubmit(): Promise<void> {
    this.especialidadesTocado.set(true);
    this.errorGeneral.set('');

    await submit(this.configuracionForm, {
      action: async (field) => {
        const especialidades = this.especialidadesSeleccionadas();
        if (
          especialidades.length === 0 ||
          especialidades.length > MAX_ESPECIALIDADES ||
          this.documentos().length === 0
        ) {
          if (this.documentos().length === 0) {
            this.errorGeneral.set('Adjunta al menos un documento que respalde tus credenciales.');
          }
          return undefined;
        }

        const value = field().value();
        this.enviando.set(true);
        try {
          const respuesta = await firstValueFrom(
            this.configuracionInicialAuditorService.completar(
              {
                aniosExperiencia: Number(value.aniosExperiencia),
                especialidades,
                descripcionProfesional: value.descripcionProfesional.trim() || null,
                sitioWeb: value.sitioWeb.trim() || null,
              },
              this.documentos()
            )
          );
          this.toastService.success(respuesta.mensaje, undefined, 8000);
          await this.router.navigateByUrl('/auditor/validacion-pendiente');
        } catch (err: unknown) {
          this.errorGeneral.set(
            apiErrorMessage(err) ?? 'No pudimos guardar tu información. Intenta nuevamente.'
          );
        } finally {
          this.enviando.set(false);
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }
}
