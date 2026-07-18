import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../shared/layouts/auth-layout/auth-layout.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

@Component({
  selector: 'app-validacion-pendiente-page',
  imports: [RouterLink, AuthLayoutComponent, HeadingComponent, BadgeComponent],
  templateUrl: './validacion-pendiente-page.component.html',
  styleUrl: './validacion-pendiente-page.component.scss',
})
export class ValidacionPendientePageComponent {}
