import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RecuperarContrasenaPageComponent } from './recuperar-contrasena-page.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('RecuperarContrasenaPageComponent', () => {
  let authService: { solicitarResetContrasena: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { solicitarResetContrasena: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RecuperarContrasenaPageComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(RecuperarContrasenaPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('se crea', () => {
    const fixture = crear();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('con correo vacio muestra error de campo y no llama al backend', async () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;

    comp.handleSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(comp.errorEmail()).toContain('correo electrónico');
    expect(authService.solicitarResetContrasena).not.toHaveBeenCalled();
  });

  it('con correo mal formado muestra error de campo y no llama al backend', async () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.model.update((m: any) => ({ ...m, email: 'no-es-un-correo' }));

    comp.handleSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(comp.errorEmail()).toContain('correo electrónico');
    expect(authService.solicitarResetContrasena).not.toHaveBeenCalled();
  });

  it('con correo valido llama al backend y muestra el mensaje uniforme', async () => {
    authService.solicitarResetContrasena.mockReturnValue(
      of({
        mensaje:
          'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.',
      })
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.model.update((m: any) => ({ ...m, email: 'ana.perez@example.com' }));

    comp.handleSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(authService.solicitarResetContrasena).toHaveBeenCalledWith('ana.perez@example.com');
    expect(comp.enviado()).toBe(true);
    expect(comp.mensaje()).toContain('Si existe una cuenta');
  });

  it('si el backend responde error, lo muestra y no marca como enviado', async () => {
    authService.solicitarResetContrasena.mockReturnValue(
      throwError(() => ({ error: { message: 'Ocurrió un error inesperado.' } }))
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.model.update((m: any) => ({ ...m, email: 'ana.perez@example.com' }));

    comp.handleSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(comp.error()).toBe('Ocurrió un error inesperado.');
    expect(comp.enviado()).toBe(false);
  });
});
