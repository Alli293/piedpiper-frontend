import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegistroUsuarioFormComponent } from './registro-usuario-form.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('RegistroUsuarioFormComponent', () => {
  let authService: { registrarUsuarioConCorreo: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { registrarUsuarioConCorreo: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegistroUsuarioFormComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(RegistroUsuarioFormComponent);
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
    setInputValue(root, 'input[autocomplete="family-name"]', 'Perez Solano');
    setInputValue(root, 'input[autocomplete="email"]', 'ana@ejemplo.com');
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

  it('con campos vacios muestra el error de cada campo simultaneamente, no solo el primero', async () => {
    const fixture = createFixture();

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorNombre()).toContain('Ingresa tu nombre');
    expect(comp.errorApellidos()).toContain('Ingresa tus apellidos');
    expect(comp.errorEmail()).toContain('correo electrónico');
    expect(comp.errorContrasena()).toContain('contraseña');
    expect(comp.errorConfirmacion()).toContain('confirmar tu contraseña');
    expect(comp.errorTerminos()).toContain('Términos y Condiciones');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('con correo sin formato valido muestra error y no llama al backend', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setInputValue(root, 'input[autocomplete="email"]', 'abc');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorEmail()).toContain('correo electrónico');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
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
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('con contrasenas que no coinciden muestra el error en el campo de confirmacion', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setInputValue(root, 'input[placeholder="Repite tu contraseña"]', 'otra-clave');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorConfirmacion()).toContain('no coinciden');
    expect(comp.error()).toBe('');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('sin aceptar terminos muestra error junto al checkbox y no llama al backend', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setChecked(root, false);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorTerminos()).toContain('Términos y Condiciones');
    expect(comp.error()).toBe('');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('con datos validos llama a registrarUsuarioConCorreo y muestra pantalla de exito', async () => {
    authService.registrarUsuarioConCorreo.mockReturnValue(
      of({ mensaje: 'Revisa tu correo', email: 'ana@ejemplo.com' })
    );

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(authService.registrarUsuarioConCorreo).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellidos: 'Perez Solano',
      email: 'ana@ejemplo.com',
      contrasena: 'clave1234',
      confirmarContrasena: 'clave1234',
      aceptaTerminos: true,
    });
    expect(comp.enviado()).toBe(true);
    expect(comp.correoEnviado()).toBe('ana@ejemplo.com');
  });

  it('si el backend responde error, lo muestra y no marca como enviado', async () => {
    authService.registrarUsuarioConCorreo.mockReturnValue(
      throwError(() => ({ error: { message: 'Ya existe una cuenta con este correo.' } }))
    );

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.error()).toBe('Ya existe una cuenta con este correo.');
    expect(comp.enviado()).toBe(false);
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
