import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { VerificarCorreoPageComponent } from './verificar-correo-page.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('VerificarCorreoPageComponent', () => {
  let authService: {
    verificarCorreo: ReturnType<typeof vi.fn>;
    reenviarVerificacion: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = {
      verificarCorreo: vi.fn(),
      reenviarVerificacion: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [VerificarCorreoPageComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();
  });

  function crear(token = 'tok-123') {
    const fixture = TestBed.createComponent(VerificarCorreoPageComponent);
    fixture.componentRef.setInput('token', token);
    fixture.detectChanges();
    return fixture;
  }

  it('sin token muestra enlace no valido sin llamar al backend', () => {
    const fixture = crear('');
    const html = (fixture.nativeElement as HTMLElement).textContent;

    expect(authService.verificarCorreo).not.toHaveBeenCalled();
    expect(html).toContain('Este enlace de verificación no es válido.');
  });

  it('con token valido muestra el mensaje de exito y el enlace a login', () => {
    authService.verificarCorreo.mockReturnValue(
      of({ mensaje: 'Tu correo fue verificado. Ya puedes iniciar sesión.' })
    );

    const fixture = crear();
    const html = (fixture.nativeElement as HTMLElement).textContent;

    expect(authService.verificarCorreo).toHaveBeenCalledWith('tok-123');
    expect(html).toContain('Tu correo fue verificado. Ya puedes iniciar sesión.');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/login"]')).not.toBeNull();
  });

  it('un 409 (correo ya verificado) se trata como positivo, no como invalido', () => {
    authService.verificarCorreo.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Tu correo ya fue verificado. Inicia sesión.' },
          })
      )
    );

    const fixture = crear();
    const html = (fixture.nativeElement as HTMLElement).textContent;

    expect(html).toContain('Tu correo ya fue verificado. Inicia sesión.');
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
  });

  it('un 400 (token mal formado) muestra el formulario de reenvio', () => {
    authService.verificarCorreo.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'El formato del enlace de verificación no es válido.' },
          })
      )
    );

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('El formato del enlace de verificación no es válido.');
    expect(root.querySelector('form')).not.toBeNull();
  });

  it('un 410 (invalido o expirado) muestra el mismo formulario de reenvio que el 400', () => {
    authService.verificarCorreo.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 410,
            error: {
              message: 'Este enlace de verificación no es válido o expiró. Solicita uno nuevo.',
            },
          })
      )
    );

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Solicita uno nuevo.');
    expect(root.querySelector('form')).not.toBeNull();
  });

  it('reenviar con correo vacio o invalido muestra error y no llama al backend', async () => {
    authService.verificarCorreo.mockReturnValue(
      throwError(() => ({ status: 410, error: { message: 'expiró' } }))
    );

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.textContent).toContain('Ingresa un correo electrónico válido.');
    expect(authService.reenviarVerificacion).not.toHaveBeenCalled();

    const emailInput = root.querySelector<HTMLInputElement>('input[type="email"]')!;
    emailInput.value = 'no-es-un-correo';
    emailInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.textContent).toContain('Ingresa un correo electrónico válido.');
    expect(authService.reenviarVerificacion).not.toHaveBeenCalled();
  });

  it('reenviar con datos validos muestra el mensaje del backend', async () => {
    authService.verificarCorreo.mockReturnValue(
      throwError(() => ({ status: 410, error: { message: 'expiró' } }))
    );
    authService.reenviarVerificacion.mockReturnValue(
      of({ mensaje: 'Si tu cuenta requiere verificación, te enviamos un nuevo enlace.' })
    );

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;
    const emailInput = root.querySelector<HTMLInputElement>('input[type="email"]')!;
    emailInput.value = 'ana@correo.com';
    emailInput.dispatchEvent(new Event('input'));

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(authService.reenviarVerificacion).toHaveBeenCalledWith('ana@correo.com');
    expect(root.textContent).toContain(
      'Si tu cuenta requiere verificación, te enviamos un nuevo enlace.'
    );
  });

  it('reenviar con 429 muestra el mensaje de limite de reenvios', async () => {
    authService.verificarCorreo.mockReturnValue(
      throwError(() => ({ status: 410, error: { message: 'expiró' } }))
    );
    authService.reenviarVerificacion.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { message: 'Has solicitado demasiados reenvíos. Intenta de nuevo en una hora.' },
          })
      )
    );

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;
    const emailInput = root.querySelector<HTMLInputElement>('input[type="email"]')!;
    emailInput.value = 'ana@correo.com';
    emailInput.dispatchEvent(new Event('input'));

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.textContent).toContain(
      'Has solicitado demasiados reenvíos. Intenta de nuevo en una hora.'
    );
  });
});
