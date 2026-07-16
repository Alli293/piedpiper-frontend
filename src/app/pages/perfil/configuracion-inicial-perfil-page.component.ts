import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfiguracionInicialLayoutComponent } from '../../shared/layouts/configuracion-inicial-layout/configuracion-inicial-layout.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { NumberInputComponent } from '../../shared/components/inputs/number-input/number-input.component';
import { SelectInputComponent } from '../../shared/components/inputs/select-input/select-input.component';
import { ToastHostComponent } from '../../shared/components/toast/toast.component';
import { ToastService } from '../../shared/services/toast.service';
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

@Component({
  selector: 'app-configuracion-inicial-perfil-page',
  imports: [
    ConfiguracionInicialLayoutComponent,
    ButtonComponent,
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
  protected readonly intentoGuardar = signal(false);

  protected readonly rol = signal<RolUsuario>('USUARIO_INDIVIDUAL');
  protected readonly empresa = signal<EmpresaPerfil | null>(null);

  protected readonly nombreVisible = signal('');
  protected readonly idioma = signal<Idioma>('ESPANOL');
  protected readonly moneda = signal<Moneda>('CRC');
  protected readonly unidades = signal<Unidades>('METRICO');

  protected readonly sectorIndustrial = signal('');
  protected readonly pais = signal('');
  protected readonly cantidadEmpleados = signal<number | null>(null);

  protected readonly esAdminEmpresa = computed(() => this.rol() === 'ADMINISTRADOR_EMPRESA');
  protected readonly esAuditor = computed(() => this.rol() === 'AUDITOR_CERTIFICADO');

  protected readonly nombreInvalido = computed(() => {
    const largo = this.nombreVisible().trim().length;
    return largo < 2 || largo > 100;
  });
  protected readonly errorNombre = computed(() => {
    if (!this.intentoGuardar()) {
      return '';
    }
    const largo = this.nombreVisible().trim().length;
    if (largo < 2) {
      return this.i18n.t('perfil.nombreError');
    }
    if (largo > 100) {
      return this.i18n.t('perfil.nombreErrorMax');
    }
    return '';
  });

  // Espejan los mínimos del backend (DatosEmpresaPerfilDTO):
  // sector @NotBlank, país @NotBlank @Size(max=100), empleados @NotNull @Positive.
  protected readonly editaEmpresa = computed(
    () => this.esAdminEmpresa() && this.empresa() !== null
  );
  protected readonly sectorInvalido = computed(
    () => this.editaEmpresa() && this.sectorIndustrial().trim().length === 0
  );
  protected readonly paisInvalido = computed(() => {
    if (!this.editaEmpresa()) {
      return false;
    }
    const pais = this.pais().trim();
    return pais.length === 0 || pais.length > 100;
  });
  protected readonly empleadosInvalidos = computed(() => {
    if (!this.editaEmpresa()) {
      return false;
    }
    const cantidad = this.cantidadEmpleados();
    return cantidad === null || cantidad <= 0;
  });
  protected readonly errorSector = computed(() =>
    this.intentoGuardar() && this.sectorInvalido() ? this.i18n.t('perfil.sectorError') : ''
  );
  protected readonly errorPais = computed(() =>
    this.intentoGuardar() && this.paisInvalido() ? this.i18n.t('perfil.paisError') : ''
  );
  protected readonly errorEmpleados = computed(() =>
    this.intentoGuardar() && this.empleadosInvalidos() ? this.i18n.t('perfil.empleadosError') : ''
  );
  protected readonly formularioInvalido = computed(
    () =>
      this.nombreInvalido() ||
      this.sectorInvalido() ||
      this.paisInvalido() ||
      this.empleadosInvalidos()
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
        this.nombreVisible.set(perfil.nombreVisible ?? '');
        this.idioma.set(perfil.preferencias.idioma);
        this.moneda.set(perfil.preferencias.moneda);
        this.unidades.set(perfil.preferencias.unidades);
        if (perfil.empresa) {
          this.sectorIndustrial.set(perfil.empresa.sectorIndustrial ?? '');
          this.pais.set(perfil.empresa.pais ?? '');
          this.cantidadEmpleados.set(perfil.empresa.cantidadEmpleados ?? null);
        }
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
    this.intentoGuardar.set(true);
    if (this.formularioInvalido()) {
      return;
    }

    const request: PerfilInicialRequest = {
      nombreVisible: this.nombreVisible().trim(),
      preferencias: {
        idioma: this.idioma(),
        moneda: this.moneda(),
        unidades: this.unidades(),
      },
    };
    if (this.esAdminEmpresa() && this.empresa()) {
      request.empresa = {
        sectorIndustrial: this.sectorIndustrial(),
        pais: this.pais().trim(),
        cantidadEmpleados: this.cantidadEmpleados() ?? 0,
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
  }

  protected onNombreChange(valor: string): void {
    this.nombreVisible.set(valor);
  }

  protected onIdiomaChange(valor: string): void {
    this.idioma.set(valor as Idioma);
  }

  protected onMonedaChange(valor: string): void {
    this.moneda.set(valor as Moneda);
  }

  protected onUnidadesChange(valor: string): void {
    this.unidades.set(valor as Unidades);
  }

  protected onSectorChange(valor: string): void {
    this.sectorIndustrial.set(valor);
  }

  protected onPaisChange(valor: string): void {
    this.pais.set(valor);
  }

  protected onCantidadEmpleadosChange(valor: number | null): void {
    this.cantidadEmpleados.set(valor);
  }
}
