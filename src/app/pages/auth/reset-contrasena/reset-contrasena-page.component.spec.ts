import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResetContrasenaPageComponent } from './reset-contrasena-page.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('ResetContrasenaPageComponent', () => {
  let authService: {
    validarTokenReset: ReturnType<typeof vi.fn>;
    restablecerContrasena: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = { validarTokenReset: vi.fn(), restablecerContrasena: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ResetContrasenaPageComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();
  });

  function crear(token = 'tok-123') {
    const fixture = TestBed.createComponent(ResetContrasenaPageComponent);
    fixture.componentRef.setInput('token', token);
    fixture.detectChanges();
    return fixture;
  }

  it('sin token muestra enlace no valido sin llamar al backend', () => {
    const fixture = crear('');
    const comp = fixture.componentInstance as any;

    expect(authService.validarTokenReset).not.toHaveBeenCalled();
    expect(comp.mensajeInvalido()).toContain('no es válido');
  });

  it('con token valido muestra el badge con el email y el formulario', () => {
    authService.validarTokenReset.mockReturnValue(of({ email: 'ana.perez@example.com' }));

    const fixture = crear();
    const comp = fixture.componentInstance as any;

    expect(authService.validarTokenReset).toHaveBeenCalledWith('tok-123');
    expect(comp.email()).toBe('ana.perez@example.com');
    expect(comp.cargando()).toBe(false);
    expect(comp.mensajeInvalido()).toBe('');
  });

  it('con token invalido o expirado muestra el mensaje y no el formulario', () => {
    authService.validarTokenReset.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 410,
            error: { message: 'Este enlace no es válido o expiró. Solicita uno nuevo.' },
          })
      )
    );

    const fixture = crear();
    const comp = fixture.componentInstance as any;

    expect(comp.mensajeInvalido()).toContain('Solicita uno nuevo');
    expect(comp.email()).toBe('');
  });

  it('con campos vacios muestra el error de cada campo simultaneamente', async () => {
    authService.validarTokenReset.mockReturnValue(of({ email: 'ana.perez@example.com' }));
    const fixture = crear();
    const comp = fixture.componentInstance as any;

    comp.handleSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(comp.errorContrasena()).toContain('contraseña');
    expect(comp.errorConfirmacion()).toContain('confirmar tu contraseña');
    expect(authService.restablecerContrasena).not.toHaveBeenCalled();
  });

  it('con contrasenas que no coinciden muestra el error en el campo de confirmacion', async () => {
    authService.validarTokenReset.mockReturnValue(of({ email: 'ana.perez@example.com' }));
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.model.update((m: any) => ({
      ...m,
      contrasena: 'Clave1234!',
      confirmarContrasena: 'OtraClave1!',
    }));

    comp.handleSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(comp.errorConfirmacion()).toContain('no coinciden');
    expect(authService.restablecerContrasena).not.toHaveBeenCalled();
  });

  it('con datos validos llama a restablecerContrasena y muestra la confirmacion', async () => {
    authService.validarTokenReset.mockReturnValue(of({ email: 'ana.perez@example.com' }));
    authService.restablecerContrasena.mockReturnValue(
      of({ mensaje: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.' })
    );
    const fixture = crear('tok-123');
    const comp = fixture.componentInstance as any;
    comp.model.update((m: any) => ({
      ...m,
      contrasena: 'Clave1234!',
      confirmarContrasena: 'Clave1234!',
    }));

    comp.handleSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(authService.restablecerContrasena).toHaveBeenCalledWith(
      'tok-123',
      'Clave1234!',
      'Clave1234!'
    );
    expect(comp.completado()).toBe(true);
    expect(comp.mensajeExito()).toContain('actualizada');
  });

  it('si el backend responde un error inesperado al restablecer, lo muestra inline y no marca como completado', async () => {
    authService.validarTokenReset.mockReturnValue(of({ email: 'ana.perez@example.com' }));
    authService.restablecerContrasena.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Ocurrió un error inesperado.' },
          })
      )
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.model.update((m: any) => ({
      ...m,
      contrasena: 'Clave1234!',
      confirmarContrasena: 'Clave1234!',
    }));

    comp.handleSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(comp.error()).toContain('Ocurrió un error inesperado');
    expect(comp.completado()).toBe(false);
    expect(comp.mensajeInvalido()).toBe('');
  });

  it('si el token se invalida justo al enviar el formulario, transiciona a la pantalla de enlace no valido', async () => {
    authService.validarTokenReset.mockReturnValue(of({ email: 'ana.perez@example.com' }));
    authService.restablecerContrasena.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 410,
            error: { message: 'Este enlace no es válido o expiró. Solicita uno nuevo.' },
          })
      )
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.model.update((m: any) => ({
      ...m,
      contrasena: 'Clave1234!',
      confirmarContrasena: 'Clave1234!',
    }));

    comp.handleSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(comp.mensajeInvalido()).toContain('Solicita uno nuevo');
    expect(comp.completado()).toBe(false);
    expect(comp.error()).toBe('');
  });
});
