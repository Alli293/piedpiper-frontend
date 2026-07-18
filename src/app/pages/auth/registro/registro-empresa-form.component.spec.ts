import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegistroEmpresaFormComponent } from './registro-empresa-form.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('RegistroEmpresaFormComponent', () => {
  let authService: { registrarEmpresaConCorreo: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { registrarEmpresaConCorreo: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegistroEmpresaFormComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(RegistroEmpresaFormComponent);
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
    setInputValue(root, 'input[autocomplete="email"]', 'ana@empresa.com');
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
    expect(comp.errorNombreAdmin()).toContain('nombre del administrador');
    expect(comp.errorApellidosAdmin()).toContain('apellidos del administrador');
    expect(comp.errorEmail()).toContain('correo electrónico');
    expect(comp.errorContrasena()).toContain('contraseña');
    expect(comp.errorConfirmacion()).toContain('confirmar tu contraseña');
    expect(comp.errorTerminos()).toContain('Términos y Condiciones');
    expect(authService.registrarEmpresaConCorreo).not.toHaveBeenCalled();
  });

  it('con correo sin formato valido muestra error y no llama al backend', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setInputValue(root, 'input[autocomplete="email"]', 'abc');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorEmail()).toContain('correo electrónico');
    expect(authService.registrarEmpresaConCorreo).not.toHaveBeenCalled();
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
    expect(authService.registrarEmpresaConCorreo).not.toHaveBeenCalled();
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
    expect(authService.registrarEmpresaConCorreo).not.toHaveBeenCalled();
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
    expect(authService.registrarEmpresaConCorreo).not.toHaveBeenCalled();
  });

  it('con datos validos llama a registrarEmpresaConCorreo y muestra pantalla de exito', async () => {
    authService.registrarEmpresaConCorreo.mockReturnValue(
      of({ mensaje: 'Revisa tu correo', email: 'ana@empresa.com' })
    );

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(authService.registrarEmpresaConCorreo).toHaveBeenCalledWith({
      nombreAdmin: 'Ana',
      apellidosAdmin: 'Perez Solano',
      emailAdmin: 'ana@empresa.com',
      contrasena: 'clave1234',
      confirmarContrasena: 'clave1234',
      aceptaTerminos: true,
    });
    expect(comp.enviado()).toBe(true);
    expect(comp.correoEnviado()).toBe('ana@empresa.com');
  });

  it('si el backend responde error, lo muestra y no marca como enviado', async () => {
    authService.registrarEmpresaConCorreo.mockReturnValue(
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
