import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { disabled, form, FormField, schema, submit, validate } from '@angular/forms/signals';
import { ConfiguracionInicialLayoutComponent } from '../../shared/layouts/configuracion-inicial-layout/configuracion-inicial-layout.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { NumberInputComponent } from '../../shared/components/inputs/number-input/number-input.component';
import { SelectInputComponent } from '../../shared/components/inputs/select-input/select-input.component';
import { ToastHostComponent } from '../../shared/components/toast/toast.component';
import { ToastService } from '../../shared/services/toast.service';
import { fieldError } from '../../shared/utils/form-field.utils';
import { I18nService } from '../../core/services/i18n.service';
import { PerfilInicialService } from '../../core/services/perfil-inicial.service';
import {
  EmpresaPerfil,
  OPCIONES_SECTOR,
  PerfilInicialRequest,
  RolUsuario,
} from '../../core/models/perfil-inicial.model';
import {
  Idioma,
  Moneda,
  OPCIONES_IDIOMA,
  OPCIONES_MONEDA,
  OPCIONES_UNIDADES,
  Unidades,
} from '../../core/models/preferencias.model';

interface PerfilInicialFormModel {
  nombreVisible: string;
  idioma: string;
  moneda: string;
  unidades: string;
  sectorIndustrial: string;
  pais: string;
  cantidadEmpleados: number | null;
}

@Component({
  selector: 'app-configuracion-inicial-perfil-page',
  imports: [
    FormField,
    ConfiguracionInicialLayoutComponent,
    ButtonComponent,
    HeadingComponent,
    TextInputComponent,
    NumberInputComponent,
    SelectInputComponent,
    ToastHostComponent,
  ],
  templateUrl: './configuracion-inicial-perfil-page.component.html',
  styleUrl: './configuracion-inicial-perfil-page.component.scss',
})
export class ConfiguracionInicialPerfilPageComponent implements OnInit {
  private readonly perfilService = inject(PerfilInicialService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  protected readonly opcionesIdioma = OPCIONES_IDIOMA;
  protected readonly opcionesMoneda = OPCIONES_MONEDA;
  protected readonly opcionesUnidades = OPCIONES_UNIDADES;
  protected readonly opcionesSector = OPCIONES_SECTOR;

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly guardando = signal(false);

  protected readonly rol = signal<RolUsuario>('USUARIO_INDIVIDUAL');
  protected readonly empresa = signal<EmpresaPerfil | null>(null);

  protected readonly esAdminEmpresa = computed(() => this.rol() === 'ADMINISTRADOR_EMPRESA');
  protected readonly esAuditor = computed(() => this.rol() === 'AUDITOR_CERTIFICADO');
  protected readonly editaEmpresa = computed(
    () => this.esAdminEmpresa() && this.empresa() !== null
  );

  protected readonly model = signal<PerfilInicialFormModel>({
    nombreVisible: '',
    idioma: 'ESPANOL',
    moneda: 'CRC',
    unidades: 'METRICO',
    sectorIndustrial: '',
    pais: '',
    cantidadEmpleados: null,
  });

  // Espejan los mínimos del backend (DatosEmpresaPerfilDTO):
  // sector @NotBlank, país @NotBlank @Size(max=100), empleados @NotNull @Positive.
  protected readonly perfilForm = form(
    this.model,
    schema<PerfilInicialFormModel>((path) => {
      validate(path.nombreVisible, ({ value }) => {
        const largo = value().trim().length;
        if (largo < 2) {
          return { kind: 'nombreCorto', message: this.i18n.t('perfil.nombreError') };
        }
        if (largo > 100) {
          return { kind: 'nombreLargo', message: this.i18n.t('perfil.nombreErrorMax') };
        }
        return undefined;
      });

      validate(path.sectorIndustrial, ({ value }) => {
        if (!this.editaEmpresa()) return undefined;
        if (value().trim().length === 0) {
          return { kind: 'sectorRequerido', message: this.i18n.t('perfil.sectorError') };
        }
        return undefined;
      });

      validate(path.pais, ({ value }) => {
        if (!this.editaEmpresa()) return undefined;
        const pais = value().trim();
        if (pais.length === 0 || pais.length > 100) {
          return { kind: 'paisInvalido', message: this.i18n.t('perfil.paisError') };
        }
        return undefined;
      });

      validate(path.cantidadEmpleados, ({ value }) => {
        if (!this.editaEmpresa()) return undefined;
        const cantidad = value();
        if (cantidad === null || cantidad <= 0) {
          return { kind: 'empleadosInvalidos', message: this.i18n.t('perfil.empleadosError') };
        }
        return undefined;
      });

      disabled(path.nombreVisible, { when: () => this.guardando() });
      disabled(path.idioma, { when: () => this.guardando() });
      disabled(path.moneda, { when: () => this.guardando() });
      disabled(path.unidades, { when: () => this.guardando() });
      disabled(path.sectorIndustrial, { when: () => this.guardando() });
      disabled(path.pais, { when: () => this.guardando() });
      disabled(path.cantidadEmpleados, { when: () => this.guardando() });
    })
  );

  protected readonly errorNombre = computed(() => fieldError(this.perfilForm.nombreVisible()));
  protected readonly errorSector = computed(() => fieldError(this.perfilForm.sectorIndustrial()));
  protected readonly errorPais = computed(() => fieldError(this.perfilForm.pais()));
  protected readonly errorEmpleados = computed(() =>
    fieldError(this.perfilForm.cantidadEmpleados())
  );

  protected readonly sectorLabel = computed(() => {
    const valor = this.empresa()?.sectorIndustrial;
    return OPCIONES_SECTOR.find((opcion) => opcion.value === valor)?.label ?? (valor || '—');
  });

  ngOnInit(): void {
    this.cargarPerfil();
  }

  protected cargarPerfil(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.perfilService.obtener().subscribe({
      next: (perfil) => {
        this.rol.set(perfil.rol);
        this.empresa.set(perfil.empresa);
        this.model.update((m) => ({
          ...m,
          nombreVisible: perfil.nombreVisible ?? '',
          idioma: perfil.preferencias.idioma,
          moneda: perfil.preferencias.moneda,
          unidades: perfil.preferencias.unidades,
          sectorIndustrial: perfil.empresa?.sectorIndustrial ?? '',
          pais: perfil.empresa?.pais ?? '',
          cantidadEmpleados: perfil.empresa?.cantidadEmpleados ?? null,
        }));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.errorCarga.set(true);
      },
    });
  }

  protected guardar(): void {
    if (this.guardando()) {
      return;
    }

    void submit(this.perfilForm, {
      action: async (field) => {
        const value = field().value();
        const request: PerfilInicialRequest = {
          nombreVisible: value.nombreVisible.trim(),
          preferencias: {
            idioma: value.idioma as Idioma,
            moneda: value.moneda as Moneda,
            unidades: value.unidades as Unidades,
          },
        };
        if (this.esAdminEmpresa() && this.empresa()) {
          request.empresa = {
            sectorIndustrial: value.sectorIndustrial,
            pais: value.pais.trim(),
            cantidadEmpleados: value.cantidadEmpleados ?? 0,
          };
        }

        this.guardando.set(true);
        this.perfilService.completar(request).subscribe({
          next: (perfil) => {
            this.i18n.usarIdioma(perfil.preferencias.idioma);
            this.guardando.set(false);
            this.router.navigateByUrl(perfil.redirect || '/').catch((err) => {
              console.error('Error al navegar tras completar el perfil inicial:', err);
            });
          },
          error: () => {
            this.guardando.set(false);
            this.toastService.error(this.i18n.t('perfil.errorGuardar'));
          },
        });
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }
}
