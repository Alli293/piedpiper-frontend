import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LinkDirective } from '../link/link.directive';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink, LinkDirective, ButtonComponent, IconComponent, LogoComponent],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
  host: {
    class: 'ch-public-header',
    role: 'banner',
  },
})
export class PublicHeaderComponent {
  mostrarBadgeVerificado = input(false);
  mostrarAyuda = input(false);
  mostrarLogin = input(false);
  mostrarCompartir = input(false);

  readonly compartir = output<void>();
}
