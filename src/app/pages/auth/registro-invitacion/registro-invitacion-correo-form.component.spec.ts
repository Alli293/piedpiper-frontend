import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegistroInvitacionCorreoFormComponent } from './registro-invitacion-correo-form.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('RegistroInvitacionCorreoFormComponent', () => {
  let authService: { registrarInvitacionConCorreo: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { registrarInvitacionConCorreo: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegistroInvitacionCorreoFormComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();
  });

  function createFixture(email = 'colab@correo.com', token = 'token-inv') {
    const fixture = TestBed.createComponent(RegistroInvitacionCorreoFormComponent);
    fixture.componentRef.setInput('email', email);
    fixture.componentRef.setInput('token', token);
    fixture.detectChanges();
    return fixture;
  }

  function setInputValue(root: HTMLElement, selector: string, value: string): void {
    const element = root.querySelector<HTMLInputElement>(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  function setChecked(root: HTMLElement, checked: boolean): void {
    const element = root.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!element) throw new Error('Checkbox not found');
    element.checked = checked;
    element.dispatchEvent(new Event('change'));
  }

  function fillValidForm(root: HTMLElement): void {
    setInputValue(root, 'input[autocomplete="given-name"]', 'Ana');
    setInputValue(root, 'input[autocomplete="family-name"]', 'Torres');
    setInputValue(root, 'input[placeholder="Tu contraseña"]', 'clave1234');
    setInputValue(root, 'input[placeholder="Repite tu contraseña"]', 'clave1234');
    setChecked(root, true);
  }

  async function submitForm(fixture: ReturnType<typeof createFixture>): Promise<void> {
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  it('se crea', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el correo de la invitacion en un campo deshabilitado, no editable', () => {
    const fixture = createFixture('invitado@empresa.com');
    const root = fixture.nativeElement as HTMLElement;

    const correoInput = root.querySelector<HTMLInputElement>('input[type="email"]');
    expect(correoInput?.value).toBe('invitado@empresa.com');
    expect(correoInput?.disabled).toBe(true);
  });

  it('con campos vacios muestra el error de cada campo simultaneamente', async () => {
    const fixture = createFixture();

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorNombre()).toContain('Ingresa tu nombre');
    expect(comp.errorApellidos()).toContain('Ingresa tus apellidos');
    expect(comp.errorContrasena()).toContain('contraseña');
    expect(comp.errorConfirmacion()).toContain('confirmar tu contraseña');
    expect(comp.errorTerminos()).toContain('Términos y Condiciones');
    expect(authService.registrarInvitacionConCorreo).not.toHaveBeenCalled();
  });

  it('con contrasena que no cumple el patron (sin numero) muestra error y no llama al backend', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setInputValue(root, 'input[placeholder="Tu contraseña"]', 'soloLetras');
    setInputValue(root, 'input[placeholder="Repite tu contraseña"]', 'soloLetras');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorContrasena()).toContain('al menos 8 caracteres');
    expect(authService.registrarInvitacionConCorreo).not.toHaveBeenCalled();
  });

  it('con contrasenas que no coinciden muestra el error en el campo de confirmacion', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setInputValue(root, 'input[placeholder="Repite tu contraseña"]', 'otra-clave1');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorConfirmacion()).toContain('no coinciden');
    expect(comp.error()).toBe('');
    expect(authService.registrarInvitacionConCorreo).not.toHaveBeenCalled();
  });

  it('sin aceptar terminos muestra error junto al checkbox y no llama al backend', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setChecked(root, false);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorTerminos()).toContain('Términos y Condiciones');
    expect(authService.registrarInvitacionConCorreo).not.toHaveBeenCalled();
  });

  it('con datos validos llama a registrarInvitacionConCorreo con el token y navega al redirect', async () => {
    authService.registrarInvitacionConCorreo.mockReturnValue(
      of({
        token: 'jwt-app',
        rol: 'USUARIO_GENERAL',
        estado: 'ACTIVO',
        redirect: '/perfil/configuracion-inicial',
      })
    );

    const fixture = createFixture('colab@correo.com', 'token-inv');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);

    await submitForm(fixture);

    expect(authService.registrarInvitacionConCorreo).toHaveBeenCalledWith('token-inv', {
      nombre: 'Ana',
      apellidos: 'Torres',
      contrasena: 'clave1234',
      confirmarContrasena: 'clave1234',
      aceptaTerminos: true,
    });
    expect(navigateSpy).toHaveBeenCalledWith('/perfil/configuracion-inicial');
  });

  it('si el backend responde error, lo muestra y no navega', async () => {
    authService.registrarInvitacionConCorreo.mockReturnValue(
      throwError(() => ({ error: { message: 'Esta invitación ya no está disponible.' } }))
    );

    const fixture = createFixture();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.error()).toBe('Esta invitación ya no está disponible.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('alternarContrasena y alternarConfirmar cambian la visibilidad de cada campo por separado', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance as any;

    comp.alternarContrasena();
    expect(comp.mostrarContrasena()).toBe(true);
    expect(comp.mostrarConfirmar()).toBe(false);

    comp.alternarConfirmar();
    expect(comp.mostrarConfirmar()).toBe(true);
  });
});
