import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CardComponent, CardPadding, CardVariant } from './card.component';

@Component({
  imports: [CardComponent],
  template: `
    <app-card [variant]="variant" [padding]="padding">
      <span card-header>Encabezado</span>
      Cuerpo
      <span card-footer>Pie</span>
    </app-card>
  `,
})
class HostComponent {
  variant: CardVariant = 'elevated';
  padding: CardPadding = 'md';
}

describe('CardComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('proyecta el contenido en header, body y footer', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('.card-header').textContent).toBe('Encabezado');
    expect(fixture.nativeElement.querySelector('.card-body').textContent).toContain('Cuerpo');
    expect(fixture.nativeElement.querySelector('.card-footer').textContent).toBe('Pie');
  });

  it('aplica las clases de variante y padding por defecto', () => {
    const fixture = createFixture();

    const host: HTMLElement = fixture.nativeElement.querySelector('app-card');
    expect(host.classList.contains('ch-card--elevated')).toBe(true);
    expect(host.classList.contains('ch-card--padding-md')).toBe(true);
  });

  it('refleja variant() y padding() en las clases del host', () => {
    const fixture = createFixture({ variant: 'outlined', padding: 'none' });

    const host: HTMLElement = fixture.nativeElement.querySelector('app-card');
    expect(host.classList.contains('ch-card--outlined')).toBe(true);
    expect(host.classList.contains('ch-card--padding-none')).toBe(true);
  });
});
