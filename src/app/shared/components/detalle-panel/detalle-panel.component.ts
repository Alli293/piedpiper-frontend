import { Component, output, input } from '@angular/core';
import { BadgeComponent, BadgeVariant } from '../badge/badge.component';
import { ButtonComponent, ButtonVariant } from '../button/button.component';
import { HeadingComponent } from '../heading/heading.component';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon-registry';

export type DetallePanelNivel = 'bronce' | 'plata' | 'oro';

export interface DetallePanelCampo {
  icono: IconName;
  etiqueta: string;
  valor: string;
}

export interface DetallePanelAccion {
  id: string;
  etiqueta: string;
  icono: IconName;
  variant: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}

export interface DetallePanelDato {
  icono: IconName;
  /** `null`/`undefined` renderiza el circulo generico verde (p. ej. certificaciones). */
  iconoModificador?: DetallePanelNivel | null;
  titulo: string;
  heroBadge: { etiqueta: string; variant: BadgeVariant; icono?: IconName };
  eyebrow: string;
  campos: DetallePanelCampo[];
  credencial: { titulo: string; subtitulo: string; descripcion: string };
}

@Component({
  selector: 'app-detalle-panel',
  imports: [BadgeComponent, ButtonComponent, HeadingComponent, IconComponent],
  templateUrl: './detalle-panel.component.html',
  styleUrl: './detalle-panel.component.scss',
})
export class DetallePanelComponent {
  dato = input.required<DetallePanelDato>();
  acciones = input<DetallePanelAccion[]>([]);
  tituloId = input<string>();

  accionClick = output<string>();
}
