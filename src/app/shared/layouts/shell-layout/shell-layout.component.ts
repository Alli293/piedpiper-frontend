import { Component, computed, input, output } from '@angular/core';
import {
  HeaderConfig,
  PageLayoutComponent,
  SidebarConfig,
} from '../page-layout/page-layout.component';
import {
  buildSidebarMenuItems,
  COMPANY_INITIALS,
  COMPANY_NAME,
  COMPANY_ROLE,
  SIDEBAR_BOTTOM_ITEMS,
  SidebarNavId,
} from './sidebar-nav';

/**
 * Layout de las páginas autenticadas.
 *
 * Owns sidebar construction so pages only need to say which nav item is active,
 * not rebuild the whole config. Usa `buildSidebarMenuItems()` de `sidebar-nav.ts`
 * como única fuente de verdad para el menú y los datos de la empresa.
 *
 * Uso:
 *   <app-shell-layout activeId="dashboard" [headerConfig]="headerConfig()">
 *     ...contenido de la página...
 *   </app-shell-layout>
 */
@Component({
  selector: 'app-shell-layout',
  imports: [PageLayoutComponent],
  template: `
    <app-page-layout
      [sidebarConfig]="sidebarConfig()"
      [headerConfig]="headerConfig()"
      (menuItemClicked)="menuItemClicked.emit($event)"
      (notificationClicked)="notificationClicked.emit()"
      (profileClicked)="profileClicked.emit()"
      (backClicked)="backClicked.emit()"
    >
      <ng-content />
    </app-page-layout>
  `,
})
export class ShellLayoutComponent {
  /** Ítem del menú que debe mostrarse como activo en esta página. */
  activeId = input.required<SidebarNavId>();

  /** Configuración del header, propia de cada página. */
  headerConfig = input.required<HeaderConfig>();

  menuItemClicked = output<string>();
  notificationClicked = output<void>();
  profileClicked = output<void>();
  backClicked = output<void>();

  protected readonly sidebarConfig = computed<SidebarConfig>(() => ({
    menuItems: buildSidebarMenuItems(this.activeId()),
    bottomItems: [...SIDEBAR_BOTTOM_ITEMS],
    companyName: COMPANY_NAME,
    companyRole: COMPANY_ROLE,
    companyInitials: COMPANY_INITIALS,
  }));
}
