import { Component, input, output } from '@angular/core';
import { SidebarComponent, SidebarMenuItem, SidebarBottomItem } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';

export interface SidebarConfig {
  menuItems: SidebarMenuItem[];
  bottomItems: SidebarBottomItem[];
  companyName: string;
  companyRole: string;
  companyInitials: string;
}

export interface HeaderConfig {
  sectionLabel: string;
  pageTitle: string;
  showNotificationDot: boolean;
  userInitials: string;
}

@Component({
  selector: 'app-page-layout',
  imports: [SidebarComponent, HeaderComponent],
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.scss',
  host: {
    class: 'ch-page-layout',
  },
})
export class PageLayoutComponent {
  sidebarConfig = input.required<SidebarConfig>();
  headerConfig = input.required<HeaderConfig>();

  menuItemClicked = output<string>();
  notificationClicked = output<void>();
  profileClicked = output<void>();
}
