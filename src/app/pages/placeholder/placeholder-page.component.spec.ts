import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PlaceholderPageComponent } from './placeholder-page.component';

describe('PlaceholderPageComponent', () => {
  let fixture: ComponentFixture<PlaceholderPageComponent>;

  async function montar(token: string | null, rol: string | null) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PlaceholderPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { token: signal(token), rol: signal(rol) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaceholderPageComponent);
    fixture.detectChanges();
  }

  function enlace(): HTMLAnchorElement {
    return fixture.nativeElement.querySelector('.placeholder__link');
  }

  /**
   * El caso que motivó el arreglo: a estas rutas se llega desde el menú lateral estando dentro, y
   * el único botón mandaba al login, o sea fuera de donde el usuario estaba.
   */
  it('con sesion abierta ofrece volver al panel del rol y no al login', async () => {
    await montar('token-valido', 'ADMINISTRADOR_EMPRESA');

    expect(enlace().getAttribute('href')).toBe('/empresa/panel');
    expect(enlace().textContent?.trim()).toBe('Volver a mi panel');
  });

  it('lleva a cada rol a su propia pantalla de inicio', async () => {
    await montar('token-valido', 'AUDITOR_CERTIFICADO');

    expect(enlace().getAttribute('href')).toBe('/auditor/auditorias');
  });

  it('sin sesion mantiene el enlace al inicio de sesion', async () => {
    await montar(null, null);

    expect(enlace().getAttribute('href')).toBe('/login');
    expect(enlace().textContent?.trim()).toBe('Volver al inicio de sesión');
  });

  /** Un rol que el frontend no conozca no puede dejar el botón apuntando a undefined. */
  it('con un rol desconocido cae al login en vez de romper el enlace', async () => {
    await montar('token-valido', 'ROL_INVENTADO');

    expect(enlace().getAttribute('href')).toBe('/login');
  });

  it('el texto cambia segun haya sesion o no', async () => {
    await montar('token-valido', 'USUARIO_INDIVIDUAL');
    expect(fixture.nativeElement.textContent).toContain('podés seguir usando el resto');

    await montar(null, null);
    expect(fixture.nativeElement.textContent).toContain('Tu autenticación fue exitosa');
  });
});
