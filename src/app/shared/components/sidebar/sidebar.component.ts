import { Component, input, output } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { IconComponent, IconName } from '../icon/icon.component';
import { LogoComponent } from '../logo/logo.component';

/** Bottom-of-sidebar items are fixed app-wide (unlike the per-page top menu items). */
export type SidebarBottomItemId = 'settings' | 'logout';

export interface SidebarMenuItem {
  label: string;
  icon: IconName;
  id: string;
  active: boolean;
  disabled?: boolean;
}

export interface SidebarBottomItem {
  label: string;
  icon: IconName;
  id: SidebarBottomItemId;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [AvatarComponent, IconComponent, LogoComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    class: 'ch-sidebar',
    role: 'complementary',
    'aria-label': 'Barra lateral',
  },
})
export class SidebarComponent {
  menuItems = input<SidebarMenuItem[]>([]);
  bottomItems = input<SidebarBottomItem[]>([]);
  companyName = input('');
  companyRole = input('');
  companyInitials = input('');

  menuItemClicked = output<string>();
}
