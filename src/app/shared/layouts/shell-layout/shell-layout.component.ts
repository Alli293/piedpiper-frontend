import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderConfig, PageLayoutComponent } from '../page-layout/page-layout.component';
import { buildSidebarConfig, SidebarNavId } from '../page-layout/sidebar-nav';

const COMPANY_NAME = 'Café del Valle S.A.';
const COMPANY_INITIALS = 'CV';

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

  activeId = input<SidebarNavId>();
  companyRole = input('Empresa · Admin');
  settingsLabel = input<string>();
  headerConfig = input.required<HeaderConfig>();
  /** Route the back button navigates to. Falls back to emitting `backClicked` if omitted. */
  backRoute = input<string>();

  backClicked = output<void>();

  protected readonly sidebarConfig = computed(() =>
    buildSidebarConfig({
      activeId: this.activeId(),
      companyName: COMPANY_NAME,
      companyRole: this.companyRole(),
      companyInitials: COMPANY_INITIALS,
      settingsLabel: this.settingsLabel(),
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
    const rutas: Record<string, string> = {
      dashboard: '/panel',
      emissions: '/emisiones/registrar',
      settings: '/configuracion',
      logout: '/login',
    };
    const ruta = rutas[id];
    if (ruta) void this.router.navigateByUrl(ruta);
  }
}
