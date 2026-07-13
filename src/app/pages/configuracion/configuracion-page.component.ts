import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  PageLayoutComponent,
  HeaderConfig,
  SidebarConfig,
} from '../../shared/layouts/page-layout/page-layout.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SelectInputComponent } from '../../shared/components/inputs/select-input/select-input.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ToastService } from '../../shared/components/toast/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { PreferenciasService } from '../../core/services/preferencias.service';
import {
  Idioma,
  Moneda,
  Unidades,
  OPCIONES_IDIOMA,
  OPCIONES_MONEDA,
  OPCIONES_UNIDADES,
  Preferencias,
} from '../../core/models/preferencias.model';

/**
 * Pantalla de Configuración — preferencias de interfaz (PP-31).
 * Permite elegir idioma, moneda y unidades; se guardan en el perfil del
 * usuario y se aplican de inmediato a la interfaz.
 */
@Component({
  selector: 'app-configuracion-page',
  imports: [
    PageLayoutComponent,
    CardComponent,
    ButtonComponent,
    SelectInputComponent,
    ToastComponent,
  ],
  templateUrl: './configuracion-page.component.html',
  styleUrl: './configuracion-page.component.scss',
})
export class ConfiguracionPageComponent implements OnInit {
  private readonly preferenciasService = inject(PreferenciasService);
  private readonly toastService = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  protected readonly opcionesIdioma = OPCIONES_IDIOMA;
  protected readonly opcionesMoneda = OPCIONES_MONEDA;
  protected readonly opcionesUnidades = OPCIONES_UNIDADES;

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);

  // Selección en edición (aún no persistida).
  protected readonly idioma = signal<Idioma>('ESPANOL');
  protected readonly moneda = signal<Moneda>('CRC');
  protected readonly unidades = signal<Unidades>('METRICO');

  protected readonly sidebarConfig = computed<SidebarConfig>(() => ({
    menuItems: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: false },
      { id: 'emisiones', label: 'Mis Emisiones', icon: 'emisiones', active: false },
      { id: 'auditores', label: 'Auditores', icon: 'auditores', active: false },
      { id: 'auditorias', label: 'Auditorías', icon: 'auditorias', active: false },
      { id: 'certificaciones', label: 'Certificaciones', icon: 'certificaciones', active: false },
      { id: 'insignias', label: 'Insignias', icon: 'insignias', active: false },
    ],
    bottomItems: [
      { id: 'configuracion', label: this.i18n.t('config.seccion'), icon: 'config' },
      { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
    ],
    companyName: 'Café del Valle S.A.',
    companyRole: 'Empresa · Admin',
    companyInitials: 'CV',
  }));

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: this.i18n.t('config.seccion').toUpperCase(),
    pageTitle: this.i18n.t('config.titulo'),
    showNotificationDot: false,
    userInitials: 'MR',
  }));

  ngOnInit(): void {
    this.preferenciasService.cargar().subscribe({
      next: (preferencias) => {
        this.aplicarSeleccion(preferencias);
        this.cargando.set(false);
      },
      // Si la lectura falla se mantienen los defaults (Español / CRC / métrico).
      error: () => this.cargando.set(false),
    });
  }

  protected guardar(): void {
    if (this.guardando()) {
      return;
    }
    this.guardando.set(true);

    this.preferenciasService
      .actualizar({
        idioma: this.idioma(),
        moneda: this.moneda(),
        unidades: this.unidades(),
      })
      .subscribe({
        next: (guardadas) => {
          this.aplicarSeleccion(guardadas);
          this.guardando.set(false);
          this.toastService.exito(this.i18n.t('config.guardarExito'));
        },
        error: () => {
          // La interfaz mantiene las preferencias previas.
          this.aplicarSeleccion(this.preferenciasService.preferencias());
          this.guardando.set(false);
          this.toastService.error(this.i18n.t('config.errorGuardar'));
        },
      });
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

  private aplicarSeleccion(preferencias: Preferencias): void {
    this.idioma.set(preferencias.idioma);
    this.moneda.set(preferencias.moneda);
    this.unidades.set(preferencias.unidades);
  }
}
