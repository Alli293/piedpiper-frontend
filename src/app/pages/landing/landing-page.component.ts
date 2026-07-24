import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { LandingComoFuncionaComponent } from './sections/landing-como-funciona.component';
import { LandingCtaComponent } from './sections/landing-cta.component';
import { LandingFuncionalidadesComponent } from './sections/landing-funcionalidades.component';
import { LandingParaQuienComponent } from './sections/landing-para-quien.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink,
    LogoComponent,
    LandingParaQuienComponent,
    LandingComoFuncionaComponent,
    LandingFuncionalidadesComponent,
    LandingCtaComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  private readonly document = inject(DOCUMENT);

  protected irASeccion(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
