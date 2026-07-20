import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ShellLayoutComponent } from './shell-layout.component';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';

describe('ShellLayoutComponent', () => {
  let authServiceStub: { cerrarSesion: ReturnType<typeof vi.fn> };
  let sesionInactividadStub: { detener: ReturnType<typeof vi.fn> };
  let routerStub: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceStub = { cerrarSesion: vi.fn() };
    sesionInactividadStub = { detener: vi.fn() };
    routerStub = { navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ShellLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: SesionInactividadService, useValue: sesionInactividadStub },
        { provide: Router, useValue: routerStub },
      ],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.componentRef.setInput('headerConfig', {
      sectionLabel: 'Panel',
      pageTitle: 'Inicio',
      showNotificationDot: false,
      userInitials: 'CV',
    });
    fixture.detectChanges();
    return fixture;
  }

  function boton(
    fixture: ReturnType<typeof createComponent>,
    ariaLabel: string
  ): HTMLButtonElement {
    const element = fixture.nativeElement as HTMLElement;
    const encontrado = Array.from(element.querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === ariaLabel
    );
    if (!encontrado) {
      throw new Error(`No se encontró el botón con aria-label "${ariaLabel}"`);
    }
    return encontrado;
  }

  it('al hacer clic en Cerrar sesión, limpia la sesión, detiene la inactividad y redirige a /login', () => {
    const fixture = createComponent();

    boton(fixture, 'Cerrar sesión').click();

    expect(authServiceStub.cerrarSesion).toHaveBeenCalled();
    expect(sesionInactividadStub.detener).toHaveBeenCalled();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('al hacer clic en Configuración, navega a /configuracion sin cerrar sesión', () => {
    const fixture = createComponent();

    boton(fixture, 'Configuración').click();

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/configuracion');
    expect(authServiceStub.cerrarSesion).not.toHaveBeenCalled();
  });

  it('al hacer clic en Madurez ambiental, navega al placeholder de benchmark', () => {
    const fixture = createComponent();

    boton(fixture, 'Madurez ambiental').click();

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/benchmark');
  });
});
