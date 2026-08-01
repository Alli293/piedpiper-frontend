import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BadgeComponent, BadgeVariant } from './badge.component';
import { IconName } from '../icon/icon.component';

@Component({
  imports: [BadgeComponent],
  template: `<app-badge [variant]="variant" [icon]="icon">Activo</app-badge>`,
})
class HostComponent {
  variant: BadgeVariant = 'neutral';
  icon: IconName | null = null;
}

describe('BadgeComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('proyecta el contenido dentro de la etiqueta', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('.ch-badge__label').textContent).toBe('Activo');
  });

  it('aplica la clase por defecto neutral cuando no se especifica variant()', () => {
    const fixture = createFixture();

    const host: HTMLElement = fixture.nativeElement.querySelector('app-badge');
    expect(host.classList.contains('ch-badge--neutral')).toBe(true);
  });

  it('refleja variant() en la clase del host', () => {
    const fixture = createFixture({ variant: 'success' });

    const host: HTMLElement = fixture.nativeElement.querySelector('app-badge');
    expect(host.classList.contains('ch-badge--success')).toBe(true);
    expect(host.classList.contains('ch-badge--neutral')).toBe(false);
  });

  it('no renderiza icono cuando icon() es null', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('app-icon')).toBeNull();
    const host: HTMLElement = fixture.nativeElement.querySelector('app-badge');
    expect(host.classList.contains('ch-badge--with-icon')).toBe(false);
  });

  it('renderiza el icono y la clase with-icon cuando icon() está presente', () => {
    const fixture = createFixture({ icon: 'success' });

    expect(fixture.nativeElement.querySelector('app-icon')).toBeTruthy();
    const host: HTMLElement = fixture.nativeElement.querySelector('app-badge');
    expect(host.classList.contains('ch-badge--with-icon')).toBe(true);
  });
});
