import { Component } from '@angular/core';
import { StateHeaderComponent } from '../../components/state-header/state-header.component';

@Component({
  selector: 'app-state-layout',
  imports: [StateHeaderComponent],
  templateUrl: './state-layout.component.html',
  styleUrl: './state-layout.component.scss',
  host: {
    class: 'ch-state-layout',
  },
})
export class StateLayoutComponent {}
