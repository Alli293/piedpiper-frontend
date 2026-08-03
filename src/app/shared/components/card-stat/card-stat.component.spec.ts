import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CardStatComponent, CardStatTone } from './card-stat.component';

@Component({
  imports: [CardStatComponent],
  template: `<app-card-stat [value]="value" [label]="label" [delta]="delta" [tono]="tono" />`,
})
class HostComponent {
  value: string | number = '1,234';
  label = 'Emisiones totales';
  delta = '';
  tono: CardStatTone = 'sky';
}

describe('CardStatComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza el label y el valor', () => {
    const fixture = createFixture({ value: '1,234', label: 'Emisiones totales' });

    expect(fixture.nativeElement.querySelector('.ch-card-stat__label').textContent).toBe(
      'Emisiones totales'
    );
    expect(fixture.nativeElement.querySelector('.ch-card-stat__value').textContent).toBe('1,234');
  });

  it('no renderiza el sub-texto cuando delta() está vacío', () => {
    const fixture = createFixture({ delta: '' });

    expect(fixture.nativeElement.querySelector('.ch-card-stat__sub')).toBeNull();
  });

  it('renderiza el sub-texto cuando delta() no está vacío', () => {
    const fixture = createFixture({ delta: '+12% vs mes anterior' });

    expect(fixture.nativeElement.querySelector('.ch-card-stat__sub').textContent).toBe(
      '+12% vs mes anterior'
    );
  });

  it('no aplica la clase green por defecto (tono sky)', () => {
    const fixture = createFixture();

    const host: HTMLElement = fixture.nativeElement.querySelector('app-card-stat');
    expect(host.classList.contains('ch-card-stat--green')).toBe(false);
  });

  it('aplica la clase green cuando tono() es green', () => {
    const fixture = createFixture({ tono: 'green' });

    const host: HTMLElement = fixture.nativeElement.querySelector('app-card-stat');
    expect(host.classList.contains('ch-card-stat--green')).toBe(true);
  });
});
