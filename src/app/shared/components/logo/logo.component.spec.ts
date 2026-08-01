import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LogoComponent, LogoType, LogoVariant } from './logo.component';

@Component({
  imports: [LogoComponent],
  template: `<app-logo [variant]="variant" [type]="type" [iconAlt]="iconAlt" />`,
})
class HostComponent {
  variant: LogoVariant = 'on-dark';
  type: LogoType = 'full';
  iconAlt = '';
}

describe('LogoComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza el texto "CarbonHub" cuando type() es full', () => {
    const fixture = createFixture({ type: 'full' });

    const texto: HTMLElement = fixture.nativeElement.querySelector('.ch-logo__text');
    expect(texto.textContent?.trim()).toBe('CarbonHub');
  });

  it('no renderiza texto cuando type() es isotype', () => {
    const fixture = createFixture({ type: 'isotype' });

    expect(fixture.nativeElement.querySelector('.ch-logo__text')).toBeNull();
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
  });

  it('usa el ícono blanco para la variante on-dark', () => {
    const fixture = createFixture({ variant: 'on-dark' });

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('isotipo-mono-white.svg');
  });

  it('usa el ícono verde para la variante on-light', () => {
    const fixture = createFixture({ variant: 'on-light' });

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('isotipo-mono-green.svg');
  });

  it('oculta el ícono de accesibilidad cuando no se provee iconAlt()', () => {
    const fixture = createFixture({ iconAlt: '' });

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });

  it('expone un alt significativo cuando se provee iconAlt()', () => {
    const fixture = createFixture({ iconAlt: 'CarbonHub' });

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.alt).toBe('CarbonHub');
    expect(img.hasAttribute('aria-hidden')).toBe(false);
  });
});
