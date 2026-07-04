import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { SelectInputComponent, SelectOption } from '../../shared/components/inputs/select-input/select-input.component';
import { TextareaComponent } from '../../shared/components/inputs/textarea/textarea.component';
import {
  PageLayoutComponent,
  SidebarConfig,
  HeaderConfig,
} from '../../shared/layouts/page-layout/page-layout.component';

@Component({
  selector: 'app-ui-kit-page',
  imports: [
    ButtonComponent,
    AvatarComponent,
    BadgeComponent,
    CardComponent,
    StatCardComponent,
    TextInputComponent,
    SelectInputComponent,
    TextareaComponent,
    PageLayoutComponent,
  ],
  templateUrl: './ui-kit-page.component.html',
  styleUrl: './ui-kit-page.component.scss',
})
export class UiKitPageComponent {
  protected readonly selectOptions: SelectOption[] = [
    { value: 'cr', label: 'Costa Rica' },
    { value: 'pa', label: 'Panamá' },
    { value: 'ni', label: 'Nicaragua' },
  ];

  protected readonly sidebarConfig = signal<SidebarConfig>({
    menuItems: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', active: true },
      { id: 'emissions', label: 'Emisiones', icon: 'chart', active: false },
      { id: 'reports', label: 'Reportes', icon: 'file', active: false },
    ],
    bottomItems: [
      { id: 'settings', label: 'Configuración', icon: 'settings' },
      { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
    ],
    companyName: 'EcoTech S.A.',
    companyRole: 'Administrador',
    companyInitials: 'ET',
  });

  protected readonly headerConfig = signal<HeaderConfig>({
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'UI Kit',
    showNotificationDot: true,
    userInitials: 'CA',
  });
}
