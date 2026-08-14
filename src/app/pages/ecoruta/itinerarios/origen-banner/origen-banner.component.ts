import { Component, input, signal } from '@angular/core';
import { BannerOrigen } from '../models/origen-banner.model';

/**
 * Puramente presentacional (PP-95): recibe el banner ya resuelto por el padre y solo decide cómo
 * mostrarlo. Cadena de fallback ante fallas de carga/datos ausentes: SVG → emoji → nombre en
 * texto. No renderiza nada si `banner` es null (establecimiento sin país registrado, código ISO
 * inválido, o REST Countries no disponible — todos casos silenciosos, nunca un error).
 */
@Component({
  selector: 'app-origen-banner',
  imports: [],
  templateUrl: './origen-banner.component.html',
  styleUrl: './origen-banner.component.scss',
})
export class OrigenBannerComponent {
  banner = input<BannerOrigen | null>(null);

  protected readonly svgFallo = signal(false);

  protected onSvgError(): void {
    this.svgFallo.set(true);
  }
}
