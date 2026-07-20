import { Component, input } from '@angular/core';
import { BadgeComponent } from '../../components/badge/badge.component';
import { IconName } from '../../components/icon/icon-registry';
import { LogoComponent } from '../../components/logo/logo.component';

@Component({
  selector: 'app-configuracion-inicial-layout',
  imports: [BadgeComponent, LogoComponent],
  templateUrl: './configuracion-inicial-layout.component.html',
  styleUrl: './configuracion-inicial-layout.component.scss',
})
export class ConfiguracionInicialLayoutComponent {
  rolLabel = input.required<string>();
  rolIcon = input.required<IconName>();
}
