import { Component, computed, input } from '@angular/core';

export type LogoVariant = 'on-dark' | 'on-light';
export type LogoType = 'full' | 'isotype';

const ICON_SRC: Record<LogoVariant, string> = {
  'on-dark': '/images/logos/isotipo-mono-white.svg',
  'on-light': '/images/logos/isotipo-mono-green.svg',
};

const CARBON_COLOR: Record<LogoVariant, string> = {
  'on-dark': 'var(--ch-text-on-dark)',
  'on-light': 'var(--ch-text-primary)',
};

const HUB_COLOR: Record<LogoVariant, string> = {
  'on-dark': 'var(--ch-green-light)',
  'on-light': 'var(--ch-green)',
};

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  host: {
    class: 'ch-logo',
    '[style.gap]': 'gap()',
  },
})
export class LogoComponent {
  variant = input<LogoVariant>('on-dark');
  type = input<LogoType>('full');
  iconSize = input(24);
  textSize = input('18px');
  gap = input('var(--ch-space-2)');
  iconAlt = input('');
  hideTextBelowDesktop = input(false);

  protected readonly iconSrc = computed(() => ICON_SRC[this.variant()]);
  protected readonly carbonColor = computed(() => CARBON_COLOR[this.variant()]);
  protected readonly hubColor = computed(() => HUB_COLOR[this.variant()]);
}
