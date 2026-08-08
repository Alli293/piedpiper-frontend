import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionService } from '../../../core/auth-session.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ROL_SIDEBAR_LABEL } from '../../../core/models/perfil-inicial.model';
import { SidebarBottomItemId } from '../../components/sidebar/sidebar.component';
import { HeaderConfig, PageLayoutComponent } from '../page-layout/page-layout.component';
import {
  AuditorSidebarNavId,
  AdminSidebarNavId,
  buildAdminSidebarConfig,
  buildAuditorSidebarConfig,
  buildSidebarConfig,
  SidebarNavId,
  SidebarNavVariant,
} from '../page-layout/sidebar-nav';
import { initialsFrom, userInitialsFrom } from '../../utils/initials.utils';
import { ToastService } from '../../services/toast.service';
import { apiErrorMessage } from '../../utils/http-error.utils';

const ERROR_PERFIL_MENSAJE = 'No se pudo cargar tu perfil. Algunos datos podrían no mostrarse.';

export type SidebarVariant = 'empresa' | 'auditor' | 'admin' | 'auto';

/** Ids this shell's own sidebarConfig can ever emit. */
type ShellMenuItemId = SidebarNavId | AuditorSidebarNavId | AdminSidebarNavId | SidebarBottomItemId;

/**
 * Shared shell for authenticated pages: owns sidebar construction so pages
 * only need to say which nav item is active, not rebuild the whole config.
 */
@Component({
  selector: 'app-shell-layout',
  imports: [PageLayoutComponent],
  templateUrl: './shell-layout.component.html',
})
export class ShellLayoutComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly sesionInactividadService = inject(SesionInactividadService);
  private readonly perfilInicialService = inject(PerfilInicialService);
  private readonly toastService = inject(ToastService);

  activeId = input<SidebarNavId | AuditorSidebarNavId | AdminSidebarNavId>();
  variant = input<SidebarNavVariant>('empresa');
  sidebarVariant = input<SidebarVariant>('auto');
  companyRole = input('Empresa · Admin');
  settingsLabel = input<string>();
  headerConfig = input.required<HeaderConfig>();
  /** Route the back button navigates to. Falls back to emitting `backClicked` if omitted. */
  backRoute = input<string>();
  /** Overrides the sidebar's display name (defaults to the company name). */
  displayName = input<string>();
  /** Overrides the sidebar's avatar initials (defaults to the company initials). */
  displayInitials = input<string>();

  backClicked = output<void>();

  private readonly resolvedVariant = computed<'empresa' | 'auditor' | 'admin'>(() => {
    const explicit = this.sidebarVariant();
    if (explicit === 'empresa' || explicit === 'auditor' || explicit === 'admin') return explicit;
    // EcoRuta already selects its own explicit navigation variant.
    if (this.variant() === 'ecoruta') return 'empresa';
    // Auto-detect from role
    const role = this.authSessionService.getRole();
    if (role === 'auditor_certificado') return 'auditor';
    return role === 'administrador_plataforma' ? 'admin' : 'empresa';
  });

  private readonly companyName = computed(
    () => this.perfilInicialService.perfil()?.empresa?.nombreEmpresa ?? ''
  );

  private readonly userInitials = computed(() => {
    const perfil = this.perfilInicialService.perfil();
    if (!perfil) return '';
    return userInitialsFrom(perfil.nombre, perfil.apellidos);
  });

  private readonly resolvedCompanyRole = computed(() => {
    const rol = this.perfilInicialService.perfil()?.rol;
    return rol ? ROL_SIDEBAR_LABEL[rol] : this.companyRole();
  });

  protected readonly sidebarConfig = computed(() => {
    if (this.resolvedVariant() === 'admin') {
      return buildAdminSidebarConfig({
        activeId: this.activeId() as AdminSidebarNavId | undefined,
        adminName:
          this.displayName() ??
          (this.perfilInicialService.perfil()?.nombreVisible || 'Administrador'),
        adminInitials: this.displayInitials() ?? this.userInitials(),
        settingsLabel: this.settingsLabel(),
      });
    }

    if (this.resolvedVariant() === 'auditor') {
      return buildAuditorSidebarConfig({
        activeId: this.activeId() as AuditorSidebarNavId | undefined,
        auditorName:
          this.displayName() ?? (this.perfilInicialService.perfil()?.nombreVisible || 'Auditor'),
        auditorInitials: this.displayInitials() ?? this.userInitials(),
        settingsLabel: this.settingsLabel(),
      });
    }

    return buildSidebarConfig({
      activeId: this.activeId() as SidebarNavId | undefined,
      companyName: this.displayName() ?? this.companyName(),
      companyRole: this.resolvedCompanyRole(),
      companyInitials: this.displayInitials() ?? initialsFrom(this.companyName()),
      settingsLabel: this.settingsLabel(),
      variant: this.variant(),
      esAdministradorEmpresa: this.authSessionService.isAdministradorEmpresa(),
    });
  });

  protected readonly resolvedHeaderConfig = computed<HeaderConfig>(() => ({
    ...this.headerConfig(),
    userInitials: this.userInitials(),
  }));

  constructor() {
    if (!this.perfilInicialService.perfil()) {
      this.perfilInicialService.obtener().subscribe({
        error: (err: unknown) =>
          this.toastService.error(apiErrorMessage(err) ?? ERROR_PERFIL_MENSAJE),
      });
    }
  }

  protected onBackClicked(): void {
    const route = this.backRoute();
    if (route) {
      void this.router.navigateByUrl(route);
      return;
    }
    this.backClicked.emit();
  }

  protected onMenuItem(id: string): void {
    const menuId = id as ShellMenuItemId;
    if (menuId === 'logout') {
      this.authService.cerrarSesion();
      this.sesionInactividadService.detener();
      void this.router.navigateByUrl('/login');
      return;
    }

    const rutas: Record<Exclude<ShellMenuItemId, 'logout'>, string> = {
      benchmark: '/empresa/benchmark',
      dashboard: '/empresa/panel',
      emissions: '/empresa/emisiones',
      certificaciones: '/empresa/certificaciones',
      'auditorias-empresa': '/empresa/auditorias',
      'insignias-empresa': '/empresa/insignias',
      colaboradores: '/empresa/invitaciones',
      'ecoruta-planificar': '/ecoruta/preferencias',
      'ecoruta-itinerarios': '/ecoruta/itinerarios',
      'ecoruta-insignias': '/ecoruta/insignias',
      settings: '/configuracion',
      'perfil-publico': '/auditor/perfil',
      auditorias: '/auditor/auditorias',
      'solicitudes-auditor': '/admin/solicitudes-auditor',
    };
    void this.router.navigateByUrl(rutas[menuId]);
  }
}
