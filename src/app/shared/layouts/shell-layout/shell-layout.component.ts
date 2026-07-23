import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionService } from '../../../core/auth-session.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { SidebarBottomItemId } from '../../components/sidebar/sidebar.component';
import { HeaderConfig, PageLayoutComponent } from '../page-layout/page-layout.component';
import {
  AuditorSidebarNavId,
  buildAuditorSidebarConfig,
  buildSidebarConfig,
  SidebarNavId,
  SidebarNavVariant,
} from '../page-layout/sidebar-nav';

const COMPANY_NAME = 'Café del Valle S.A.';
const COMPANY_INITIALS = 'CV';

export type SidebarVariant = 'empresa' | 'auditor';

/** Ids this shell's own sidebarConfig can ever emit. */
type ShellMenuItemId = SidebarNavId | AuditorSidebarNavId | SidebarBottomItemId;

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

  activeId = input<SidebarNavId | AuditorSidebarNavId>();
  variant = input<SidebarNavVariant>('empresa');
  sidebarVariant = input<SidebarVariant>('empresa');
  companyName = input(COMPANY_NAME);
  companyRole = input('Empresa · Admin');
  companyInitials = input(COMPANY_INITIALS);
  settingsLabel = input<string>();
  headerConfig = input.required<HeaderConfig>();
  /** Route the back button navigates to. Falls back to emitting `backClicked` if omitted. */
  backRoute = input<string>();
  /** Overrides the sidebar's display name (defaults to the company name). */
  displayName = input<string>();
  /** Overrides the sidebar's avatar initials (defaults to the company initials). */
  displayInitials = input<string>();

  backClicked = output<void>();

  protected readonly sidebarConfig = computed(() => {
    if (this.sidebarVariant() === 'auditor') {
      return buildAuditorSidebarConfig({
        activeId: this.activeId() as AuditorSidebarNavId | undefined,
        auditorName: this.authSessionService.getUserName() || 'Auditor',
        auditorInitials: this.authSessionService.getUserInitials(),
        settingsLabel: this.settingsLabel(),
      });
    }

    return buildSidebarConfig({
      activeId: this.activeId() as SidebarNavId | undefined,
      companyName: this.displayName() ?? this.companyName(),
      companyRole: this.companyRole(),
      companyInitials: this.displayInitials() ?? this.companyInitials(),
      settingsLabel: this.settingsLabel(),
      variant: this.variant(),
    });
  });

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
      benchmark: '/benchmark',
      dashboard: '/panel',
      emissions: '/emisiones',
      'ecoruta-planificar': '/ecoruta/planificar',
      'ecoruta-itinerarios': '/ecoruta/itinerarios',
      'ecoruta-insignias': '/ecoruta/insignias',
      settings: '/configuracion',
      'perfil-publico': '/auditor/perfil',
      auditorias: '/auditor/panel',
    };
    void this.router.navigateByUrl(rutas[menuId]);
  }
}
