import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthLayoutComponent } from './auth-layout.component';

@Component({
  imports: [AuthLayoutComponent],
  template: `<app-auth-layout><p>Formulario de acceso</p></app-auth-layout>`,
})
class HostComponent {}

describe('AuthLayoutComponent', () => {
  function createFixture() {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza el logo y el copy de la sección hero', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-logo')).toBeTruthy();
    expect(root.querySelector('.ch-auth-layout__tagline')).toBeTruthy();
  });

  it('renderiza las estadísticas de la plataforma', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const stats = root.querySelectorAll('.ch-auth-layout__stat');
    expect(stats.length).toBe(3);
    expect(root.textContent).toContain('empresas certificadas');
  });

  it('proyecta el contenido del panel dentro de ch-auth-layout__panel-inner', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-auth-layout__panel-inner')?.textContent).toContain(
      'Formulario de acceso'
    );
  });
});
