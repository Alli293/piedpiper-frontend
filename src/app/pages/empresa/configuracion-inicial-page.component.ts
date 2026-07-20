import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required, schema, submit, validate } from '@angular/forms/signals';
import { ConfiguracionInicialLayoutComponent } from '../../shared/layouts/configuracion-inicial-layout/configuracion-inicial-layout.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { TextareaComponent } from '../../shared/components/inputs/textarea/textarea.component';
import { EmpresaService } from '../../core/empresa/empresa.service';
import {
  ConfiguracionInicialEmpresaResponse,
  SectorIndustrial,
} from '../../core/empresa/empresa.models';

const CEDULA_JURIDICA_PATTERN = /^\d-\d{3}-\d{6}$/;

interface ConfiguracionInicialFormModel {
  nombreEmpresa: string;
  cedulaJuridica: string;
  sectorIndustrial: string;
  pais: string;
  cantidadEmpleados: string;
  descripcion: string;
}

const INITIAL_MODEL: ConfiguracionInicialFormModel = {
  nombreEmpresa: '',
  cedulaJuridica: '',
  sectorIndustrial: '',
  pais: 'CR',
  cantidadEmpleados: '',
  descripcion: '',
};

@Component({
  selector: 'app-configuracion-inicial-page',
  imports: [
    FormField,
    ConfiguracionInicialLayoutComponent,
    ButtonComponent,
    HeadingComponent,
    TextInputComponent,
    SelectInputComponent,
    TextareaComponent,
  ],
  templateUrl: './configuracion-inicial-page.component.html',
  styleUrl: './configuracion-inicial-page.component.scss',
})
export class ConfiguracionInicialPageComponent {
  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);

  protected readonly sectoresIndustriales: SelectOption[] = [
    { value: 'HOTELERIA', label: 'Hotelería' },
    { value: 'AGROINDUSTRIA', label: 'Agroindustria' },
    { value: 'TRANSPORTE', label: 'Transporte' },
    { value: 'MANUFACTURA', label: 'Manufactura' },
    { value: 'SERVICIOS', label: 'Servicios' },
    { value: 'RETAIL', label: 'Retail / Comercio' },
    { value: 'OTRO', label: 'Otro' },
  ];

  protected readonly paises: SelectOption[] = [
    { value: 'CR', label: 'Costa Rica' },
    { value: 'GT', label: 'Guatemala' },
    { value: 'HN', label: 'Honduras' },
    { value: 'SV', label: 'El Salvador' },
    { value: 'NI', label: 'Nicaragua' },
    { value: 'PA', label: 'Panamá' },
    { value: 'MX', label: 'México' },
    { value: 'CO', label: 'Colombia' },
  ];

  protected readonly model = signal<ConfiguracionInicialFormModel>({ ...INITIAL_MODEL });

  protected readonly configuracionForm = form(
    this.model,
    schema<ConfiguracionInicialFormModel>((path) => {
      required(path.nombreEmpresa, { message: 'Ingresa el nombre legal de la empresa.' });

      validate(path.cedulaJuridica, ({ value }) => {
        if (!CEDULA_JURIDICA_PATTERN.test(value().trim())) {
          return {
            kind: 'cedulaJuridicaInvalida',
            message: 'Formato de cédula jurídica inválido (ej. 3-101-123456).',
          };
        }
        return undefined;
      });

      required(path.sectorIndustrial, { message: 'Selecciona una opción válida.' });
      required(path.pais, { message: 'Selecciona una opción válida.' });

      validate(path.cantidadEmpleados, ({ value }) => {
        const raw = value();
        const cantidad = Number(raw);
        if (!raw.trim() || !Number.isInteger(cantidad) || cantidad <= 0) {
          return {
            kind: 'cantidadEmpleadosInvalida',
            message: 'Ingresa un número de empleados mayor que 0.',
          };
        }
        return undefined;
      });

      validate(path.descripcion, ({ value }) => {
        if (value().length > 300) {
          return {
            kind: 'descripcionMuyLarga',
            message: 'La descripción no puede superar los 300 caracteres.',
          };
        }
        return undefined;
      });
    })
  );

  protected readonly error = signal('');
  protected readonly enviado = signal(false);
  protected readonly resultado = signal<ConfiguracionInicialEmpresaResponse | null>(null);

  protected readonly errorNombreEmpresa = computed(() =>
    this.fieldError(this.configuracionForm.nombreEmpresa())
  );
  protected readonly errorCedulaJuridica = computed(() =>
    this.fieldError(this.configuracionForm.cedulaJuridica())
  );
  protected readonly errorSectorIndustrial = computed(() =>
    this.fieldError(this.configuracionForm.sectorIndustrial())
  );
  protected readonly errorPais = computed(() => this.fieldError(this.configuracionForm.pais()));
  protected readonly errorCantidadEmpleados = computed(() =>
    this.fieldError(this.configuracionForm.cantidadEmpleados())
  );
  protected readonly errorDescripcion = computed(() =>
    this.fieldError(this.configuracionForm.descripcion())
  );

  protected readonly submitting = computed(() => this.configuracionForm().submitting());
  protected readonly descripcionContador = computed(() => `${this.model().descripcion.length}/300`);

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  protected continuar(): void {
    this.router.navigateByUrl('/perfil/configuracion-inicial').catch((err) => {
      console.error('Error al navegar tras completar configuración inicial:', err);
    });
  }

  private async onSubmit(): Promise<void> {
    await submit(this.configuracionForm, async (field) => {
      const value = field().value();
      try {
        const respuesta = await firstValueFrom(
          this.empresaService.completarConfiguracionEmpresa({
            nombreEmpresa: value.nombreEmpresa.trim(),
            cedulaJuridica: value.cedulaJuridica.trim(),
            sectorIndustrial: value.sectorIndustrial as SectorIndustrial,
            pais: value.pais,
            cantidadEmpleados: Number(value.cantidadEmpleados),
            descripcion: value.descripcion.trim() || undefined,
          })
        );
        this.error.set('');
        this.resultado.set(respuesta);
        this.enviado.set(true);
      } catch (err: unknown) {
        this.error.set(
          (err as { error?: { message?: string } })?.error?.message ??
            'No pudimos guardar la información de tu empresa. Intenta nuevamente.'
        );
      }
      return undefined;
    });
  }

  private fieldError(field: {
    touched(): boolean;
    errors(): readonly { message?: string }[];
  }): string {
    if (!field.touched()) return '';
    return field.errors()[0]?.message ?? '';
  }
}
