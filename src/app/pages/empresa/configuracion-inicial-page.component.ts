import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfiguracionInicialLayoutComponent } from '../../shared/layouts/configuracion-inicial-layout/configuracion-inicial-layout.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
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

@Component({
  selector: 'app-configuracion-inicial-page',
  imports: [
    ConfiguracionInicialLayoutComponent,
    ButtonComponent,
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

  protected readonly nombreEmpresa = signal('');
  protected readonly cedulaJuridica = signal('');
  protected readonly sectorIndustrial = signal('');
  protected readonly pais = signal('CR');
  protected readonly cantidadEmpleados = signal('');
  protected readonly descripcion = signal('');

  protected readonly errorNombreEmpresa = signal('');
  protected readonly errorCedulaJuridica = signal('');
  protected readonly errorSectorIndustrial = signal('');
  protected readonly errorPais = signal('');
  protected readonly errorCantidadEmpleados = signal('');
  protected readonly errorDescripcion = signal('');

  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly enviado = signal(false);
  protected readonly resultado = signal<ConfiguracionInicialEmpresaResponse | null>(null);

  protected readonly descripcionContador = computed(() => `${this.descripcion().length}/300`);

  protected enviar(event?: Event): void {
    event?.preventDefault();
    if (this.cargando()) {
      return;
    }
    if (!this.validar()) {
      return;
    }

    this.cargando.set(true);
    this.empresaService
      .completarConfiguracionEmpresa({
        nombreEmpresa: this.nombreEmpresa().trim(),
        cedulaJuridica: this.cedulaJuridica().trim(),
        sectorIndustrial: this.sectorIndustrial() as SectorIndustrial,
        pais: this.pais(),
        cantidadEmpleados: Number(this.cantidadEmpleados()),
        descripcion: this.descripcion().trim() || undefined,
      })
      .subscribe({
        next: (respuesta) => {
          this.cargando.set(false);
          this.resultado.set(respuesta);
          this.enviado.set(true);
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(
            err?.error?.message ??
              'No pudimos guardar la información de tu empresa. Intenta nuevamente.'
          );
        },
      });
  }

  protected continuar(): void {
    // TODO: reemplazar '/empresa/panel' por el dashboard real de empresa
    // cuando exista (hoy es una ruta placeholder protegida por el guard).
    this.router.navigateByUrl('/empresa/panel').catch((err) => {
      console.error('Error al navegar tras completar configuración inicial:', err);
    });
  }

  private validar(): boolean {
    this.error.set('');
    this.errorNombreEmpresa.set('');
    this.errorCedulaJuridica.set('');
    this.errorSectorIndustrial.set('');
    this.errorPais.set('');
    this.errorCantidadEmpleados.set('');
    this.errorDescripcion.set('');

    if (!this.nombreEmpresa().trim()) {
      this.errorNombreEmpresa.set('Ingresa el nombre legal de la empresa.');
      return false;
    }
    if (!CEDULA_JURIDICA_PATTERN.test(this.cedulaJuridica().trim())) {
      this.errorCedulaJuridica.set('Formato de cédula jurídica inválido (ej. 3-101-123456).');
      return false;
    }
    if (!this.sectorIndustrial()) {
      this.errorSectorIndustrial.set('Selecciona una opción válida.');
      return false;
    }
    if (!this.pais()) {
      this.errorPais.set('Selecciona una opción válida.');
      return false;
    }
    const cantidad = Number(this.cantidadEmpleados());
    if (!this.cantidadEmpleados().trim() || !Number.isInteger(cantidad) || cantidad <= 0) {
      this.errorCantidadEmpleados.set('Ingresa un número de empleados mayor que 0.');
      return false;
    }
    if (this.descripcion().length > 300) {
      this.errorDescripcion.set('La descripción no puede superar los 300 caracteres.');
      return false;
    }
    return true;
  }
}
