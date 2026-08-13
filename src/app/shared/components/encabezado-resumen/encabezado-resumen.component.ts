import { Component, input } from '@angular/core';
import { HeadingComponent } from '../heading/heading.component';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon-registry';

export type EncabezadoResumenTono = 'success' | 'warning' | 'danger' | 'info' | 'new';

@Component({
  selector: 'app-encabezado-resumen',
  imports: [HeadingComponent, IconComponent],
  templateUrl: './encabezado-resumen.component.html',
  styleUrl: './encabezado-resumen.component.scss',
})
export class EncabezadoResumenComponent {
  icono = input.required<IconName>();
  tono = input<EncabezadoResumenTono>('success');
  titulo = input.required<string>();
  subtexto = input('');
  statValor = input<number | string | null>(null);
  statLabel = input('');
}
