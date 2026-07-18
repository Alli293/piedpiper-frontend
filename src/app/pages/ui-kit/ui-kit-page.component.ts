import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { SemanticCardComponent } from '../../shared/components/semantic-card/semantic-card.component';
import { CardStatComponent } from '../../shared/components/card-stat/card-stat.component';
import { PublicStatComponent } from '../../shared/components/public-stat/public-stat.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { LinkDirective } from '../../shared/components/link/link.directive';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { TextareaComponent } from '../../shared/components/inputs/textarea/textarea.component';
import { CheckboxComponent } from '../../shared/components/inputs/checkbox/checkbox.component';
import { RadioComponent } from '../../shared/components/inputs/radio/radio.component';
import { RadioGroupDirective } from '../../shared/components/inputs/radio/radio-group.directive';
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
    HeadingComponent,
    CardComponent,
    SemanticCardComponent,
    CardStatComponent,
    PublicStatComponent,
    LogoComponent,
    LinkDirective,
    TextInputComponent,
    SelectInputComponent,
    TextareaComponent,
    CheckboxComponent,
    RadioComponent,
    RadioGroupDirective,
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

  protected readonly termsAccepted = signal(false);
  protected readonly selectedPlan = signal<string | null>('basic');

  protected readonly sidebarConfig = signal<SidebarConfig>({
    menuItems: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: false },
      { id: 'emissions', label: 'Mis Emisiones', icon: 'emisiones', active: true },
      { id: 'auditors', label: 'Auditores', icon: 'auditores', active: false },
      { id: 'audits', label: 'Auditorías', icon: 'auditorias', active: false },
      { id: 'certifications', label: 'Certificaciones', icon: 'certificaciones', active: false },
      { id: 'benchmark', label: 'Madurez Ambiental', icon: 'benchmark', active: false },
      { id: 'badges', label: 'Insignias', icon: 'insignias', active: false },
      { id: 'public-profile', label: 'Perfil Público', icon: 'perfil-publico', active: false },
      { id: 'team-members', label: 'Colaboradores', icon: 'colaboradores', active: false },
    ],
    bottomItems: [
      { id: 'settings', label: 'Configuración', icon: 'config' },
      { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
    ],
    companyName: 'Café del Valle S.A.',
    companyRole: 'Administrador',
    companyInitials: 'CV',
  });

  protected readonly headerConfig = signal<HeaderConfig>({
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'UI Kit',
    showNotificationDot: true,
    userInitials: 'CA',
  });
}
