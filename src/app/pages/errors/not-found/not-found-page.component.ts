import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StateLayoutComponent } from '../../../shared/layouts/state-layout/state-layout.component';

@Component({
  selector: 'app-not-found-page',
  imports: [StateLayoutComponent, ButtonComponent, HeadingComponent, IconComponent, RouterLink],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.scss',
})
export class NotFoundPageComponent {
  private readonly location = inject(Location);

  protected goBack(): void {
    this.location.back();
  }
}
