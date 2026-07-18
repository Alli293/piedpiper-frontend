import { Component, input, output } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { IconComponent, IconName } from '../icon/icon.component';

export interface SidebarMenuItem {
  label: string;
  icon: IconName;
  id: string;
  active: boolean;
}

export interface SidebarBottomItem {
  label: string;
  icon: IconName;
  id: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [AvatarComponent, IconComponent],
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
