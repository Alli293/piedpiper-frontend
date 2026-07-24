import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SidebarBottomItemId } from '../../components/sidebar/sidebar.component';
import { HeaderConfig, PageLayoutComponent } from '../page-layout/page-layout.component';
import { buildSidebarConfig, SidebarNavId, SidebarNavItemDef } from '../page-layout/sidebar-nav';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';

const COMPANY_NAME = 'Café del Valle S.A.';
const COMPANY_INITIALS = 'CV';

/** Ids this shell's own sidebarConfig can ever emit (see buildSidebarConfig). */
type ShellMenuItemId = SidebarNavId | SidebarBottomItemId;

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
  private readonly sesionInactividadService = inject(SesionInactividadService);

  activeId = input<SidebarNavId>();
  companyRole = input('Empresa · Admin');
  settingsLabel = input<string>();
  headerConfig = input.required<HeaderConfig>();
  /** Route the back button navigates to. Falls back to emitting `backClicked` if omitted. */
  backRoute = input<string>();
  /** Overrides the sidebar's display name (defaults to the company name). E.g. an individual user's own name. */
  displayName = input<string>();
  /** Overrides the sidebar's avatar initials (defaults to the company initials). */
  displayInitials = input<string>();
  /** Overrides the sidebar's nav items (e.g. ECORUTA_NAV_ITEMS for the individual-traveler shell). */
  navItems = input<readonly SidebarNavItemDef[]>();

  backClicked = output<void>();

  protected readonly sidebarConfig = computed(() =>
    buildSidebarConfig({
      activeId: this.activeId(),
      companyName: this.displayName() ?? COMPANY_NAME,
      companyRole: this.companyRole(),
      companyInitials: this.displayInitials() ?? COMPANY_INITIALS,
      settingsLabel: this.settingsLabel(),
      navItems: this.navItems(),
    })
  );

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
      ecoruta: '/ecoruta/preferencias',
      emissions: '/emisiones',
      settings: '/configuracion',
    };
    void this.router.navigateByUrl(rutas[menuId]);
  }
}
