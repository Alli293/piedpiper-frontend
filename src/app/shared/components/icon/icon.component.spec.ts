import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';
import { IconName } from './icon-registry';

@Component({
  imports: [IconComponent],
  template: `<app-icon [name]="name" [size]="size" />`,
})
class HostComponent {
  name: IconName = 'login';
  size = 16;
}

describe('IconComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza el svg correspondiente al icono solicitado', () => {
    const fixture = createFixture({ name: 'delete' });

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('cambia el svg renderizado según name()', () => {
    const login = createFixture({ name: 'login' }).nativeElement.querySelector(
      '.ch-icon'
    ).innerHTML;
    TestBed.resetTestingModule();
    const logout = createFixture({ name: 'logout' }).nativeElement.querySelector(
      '.ch-icon'
    ).innerHTML;

    expect(login).not.toBe(logout);
  });

  it('usa 16px como tamaño por defecto', () => {
    const fixture = createFixture();

    const host: HTMLElement = fixture.nativeElement.querySelector('app-icon');
    expect(host.style.width).toBe('16px');
    expect(host.style.height).toBe('16px');
  });

  it('aplica el tamaño recibido en size()', () => {
    const fixture = createFixture({ size: 24 });

    const host: HTMLElement = fixture.nativeElement.querySelector('app-icon');
    expect(host.style.width).toBe('24px');
    expect(host.style.height).toBe('24px');
  });
});
