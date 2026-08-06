import { Component } from '@angular/core';
import { PublicHeaderComponent } from '../../components/public-header/public-header.component';

@Component({
  selector: 'app-state-layout',
  imports: [PublicHeaderComponent],
  templateUrl: './state-layout.component.html',
  styleUrl: './state-layout.component.scss',
  host: {
    class: 'ch-state-layout',
  },
})
export class StateLayoutComponent {}
