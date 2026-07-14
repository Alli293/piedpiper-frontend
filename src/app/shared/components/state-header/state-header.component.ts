import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LinkDirective } from '../link/link.directive';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-state-header',
  imports: [RouterLink, LinkDirective, IconComponent],
  templateUrl: './state-header.component.html',
  styleUrl: './state-header.component.scss',
  host: {
    class: 'ch-state-header',
    role: 'banner',
  },
})
export class StateHeaderComponent {}
