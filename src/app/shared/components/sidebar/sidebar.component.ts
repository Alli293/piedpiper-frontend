import { Component, input, output } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';

export interface SidebarMenuItem {
  label: string;
  icon: string;
  id: string;
  active: boolean;
}

export interface SidebarBottomItem {
  label: string;
  icon: string;
  id: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [AvatarComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    class: 'ch-sidebar',
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
