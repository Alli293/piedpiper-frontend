import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegistroInvitacionPageComponent } from './registro-invitacion-page.component';
import { RegistroInvitacionCorreoFormComponent } from './registro-invitacion-correo-form.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import { InvitacionesService } from '../../../core/invitaciones/invitaciones.service';

describe('RegistroInvitacionPageComponent', () => {
  let invitacionesService: { resolver: ReturnType<typeof vi.fn> };
  let authService: { registrarConInvitacion: ReturnType<typeof vi.fn> };
  let googleIdentity: { renderizarBoton: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    invitacionesService = {
      resolver: vi
        .fn()
        .mockReturnValue(of({ email: 'colab@correo.com', nombreEmpresa: 'Acme S.A.' })),
    };
    authService = { registrarConInvitacion: vi.fn() };
    googleIdentity = { renderizarBoton: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [RegistroInvitacionPageComponent],
      providers: [
        provideRouter([]),
        { provide: InvitacionesService, useValue: invitacionesService },
        { provide: AuthService, useValue: authService },
        { provide: GoogleIdentityService, useValue: googleIdentity },
      ],
    }).compileComponents();
  });

  function crear(token = 'tok-123') {
    const fixture = TestBed.createComponent(RegistroInvitacionPageComponent);
    fixture.componentRef.setInput('token', token);
    fixture.detectChanges();
    return fixture;
  }

  it('con token valido muestra la empresa en el callout y el correo invitado en el form embebido', () => {
    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(invitacionesService.resolver).toHaveBeenCalledWith('tok-123');
    expect(root.textContent).toContain('Acme S.A.');

    const correoInput = root.querySelector<HTMLInputElement>('input[type="email"]');
    expect(correoInput?.value).toBe('colab@correo.com');
    expect(correoInput?.disabled).toBe(true);
  });

  it('pasa el email y el token correctos al formulario de registro por correo embebido', () => {
    const fixture = crear('tok-456');
    const formulario = fixture.debugElement.query(
      By.directive(RegistroInvitacionCorreoFormComponent)
    );

    expect(formulario).not.toBeNull();
    expect(formulario.componentInstance.email()).toBe('colab@correo.com');
    expect(formulario.componentInstance.token()).toBe('tok-456');
  });

  it('con token inexistente muestra el mensaje de enlace invalido sin formulario', () => {
    invitacionesService.resolver.mockReturnValue(throwError(() => ({ status: 404 })));
    const fixture = crear();
    const html = (fixture.nativeElement as HTMLElement).textContent;

    expect(html).toContain('Este enlace de invitación no es válido.');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-checkbox')).toBeNull();
  });

  it('con token expirado muestra el mensaje de expiracion', () => {
    invitacionesService.resolver.mockReturnValue(throwError(() => ({ status: 410 })));
    const fixture = crear();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Esta invitación ha expirado. Solicita una nueva al administrador de tu empresa.'
    );
  });

  it('sin aceptar los terminos no registra', () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;

    comp.registrar('id-token');

    expect(authService.registrarConInvitacion).not.toHaveBeenCalled();
  });

  it('con terminos aceptados registra y navega al redirect', () => {
    authService.registrarConInvitacion.mockReturnValue(
      of({
        token: 't',
        rol: 'USUARIO_GENERAL',
        estado: 'ACTIVO',
        redirect: '/perfil/configuracion-inicial',
      })
    );
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.aceptaTerminos.set(true);

    comp.registrar('id-token');

    expect(authService.registrarConInvitacion).toHaveBeenCalledWith('tok-123', 'id-token', true);
    expect(navegar).toHaveBeenCalledWith('/perfil/configuracion-inicial');
  });

  it('un 409 muestra el mensaje y el enlace a iniciar sesion', () => {
    authService.registrarConInvitacion.mockReturnValue(
      throwError(() => ({
        status: 409,
        error: { message: 'Este correo ya tiene una cuenta en CarbonHub. ¿Deseas iniciar sesión?' },
      }))
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.aceptaTerminos.set(true);

    comp.registrar('id-token');
    fixture.detectChanges();

    expect(comp.cuentaExistente()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Iniciar sesión');
  });
});
