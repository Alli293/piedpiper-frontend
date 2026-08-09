import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicHeaderComponent } from './public-header.component';

@Component({
  imports: [PublicHeaderComponent],
  template: `<app-public-header
    [mostrarBadgeVerificado]="mostrarBadgeVerificado"
    [mostrarAyuda]="mostrarAyuda"
    [mostrarLogin]="mostrarLogin"
    [mostrarCompartir]="mostrarCompartir"
    (compartir)="onCompartir()"
  />`,
})
class HostComponent {
  mostrarBadgeVerificado = false;
  mostrarAyuda = false;
  mostrarLogin = false;
  mostrarCompartir = false;
  compartirEmitido = 0;

  onCompartir(): void {
    this.compartirEmitido++;
  }
}

describe('PublicHeaderComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('expone role banner en el host', () => {
    const fixture = createFixture();

    const header = fixture.nativeElement.querySelector('app-public-header');
    expect(header.getAttribute('role')).toBe('banner');
  });

  it('siempre renderiza el logo', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('app-logo')).toBeTruthy();
  });

  it('no renderiza badge, ayuda, login ni compartir por defecto', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).not.toContain('Perfil verificado');
    expect(root.textContent).not.toContain('Ayuda');
    expect(root.textContent).not.toContain('Iniciar sesión');
    expect(root.textContent).not.toContain('Compartir');
  });

  it('renderiza el badge de perfil verificado cuando se activa', () => {
    const fixture = createFixture({ mostrarBadgeVerificado: true });

    expect(fixture.nativeElement.textContent).toContain('Perfil verificado');
  });

  it('renderiza ayuda cuando se activa', () => {
    const fixture = createFixture({ mostrarAyuda: true });

    expect(fixture.nativeElement.textContent).toContain('Ayuda');
  });

  it('renderiza el enlace de inicio de sesión cuando se activa', () => {
    const fixture = createFixture({ mostrarLogin: true });
    const root = fixture.nativeElement as HTMLElement;

    const enlace: HTMLAnchorElement | null = root.querySelector('a[href="/login"]');
    expect(enlace?.textContent).toContain('Iniciar sesión');
  });

  it('renderiza el boton de compartir cuando se activa', () => {
    const fixture = createFixture({ mostrarCompartir: true });

    expect(fixture.nativeElement.textContent).toContain('Compartir');
  });

  it('emite compartir al hacer clic en el boton de compartir', () => {
    const fixture = createFixture({ mostrarCompartir: true });
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.ch-public-header__compartir'
    );

    boton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.compartirEmitido).toBe(1);
  });
});
