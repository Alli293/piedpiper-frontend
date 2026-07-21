import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegistroRolPageComponent } from './registro-rol-page.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';

describe('RegistroRolPageComponent', () => {
  let authService: {
    registrarConGoogle: ReturnType<typeof vi.fn>;
    registrarEmpresaConCorreo: ReturnType<typeof vi.fn>;
    registrarUsuarioConCorreo: ReturnType<typeof vi.fn>;
    registrarAuditorCorreo: ReturnType<typeof vi.fn>;
  };
  let googleIdentity: { renderizarBoton: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authService = {
      registrarConGoogle: vi.fn().mockReturnValue(of({})),
      registrarEmpresaConCorreo: vi.fn(),
      registrarUsuarioConCorreo: vi.fn(),
      registrarAuditorCorreo: vi.fn(),
    };
    googleIdentity = { renderizarBoton: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [RegistroRolPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: GoogleIdentityService, useValue: googleIdentity },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  function createFixture(rol: string): ComponentFixture<RegistroRolPageComponent> {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', rol);
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

  function fillValidForm(root: HTMLElement, email: string): void {
    setInputValue(root, 'input[autocomplete="given-name"]', 'Ana');
    setInputValue(root, 'input[autocomplete="family-name"]', 'Perez Solano');
    setInputValue(root, 'input[autocomplete="email"]', email);
    setInputValue(root, 'input[placeholder="Tu contraseña"]', 'Clave1234.');
    setInputValue(root, 'input[placeholder="Repite tu contraseña"]', 'Clave1234.');
    setChecked(root, true);
  }

  async function submitForm(fixture: ComponentFixture<RegistroRolPageComponent>): Promise<void> {
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  it('mapea el rol empresa al badge correcto', () => {
    const fixture = createFixture('empresa');
    const badge = fixture.nativeElement.querySelector('app-badge');
    expect(badge.textContent.trim()).toBe('EMPRESA · ADMINISTRADOR');
  });

  it('mapea el rol auditor al badge correcto', () => {
    const fixture = createFixture('auditor');
    const badge = fixture.nativeElement.querySelector('app-badge');
    expect(badge.textContent.trim()).toBe('AUDITOR CERTIFICADO');
  });

  it('mapea el rol viajero al badge correcto', () => {
    const fixture = createFixture('viajero');
    const badge = fixture.nativeElement.querySelector('app-badge');
    expect(badge.textContent.trim()).toBe('VIAJERO SOSTENIBLE');
  });

  it('con un rol invalido no renderiza la tarjeta de registro', () => {
    const fixture = createFixture('inventado');
    expect(fixture.nativeElement.querySelector('app-badge')).toBeNull();
  });

  it('con rol empresa muestra la tarjeta semantica del siguiente paso', () => {
    const fixture = createFixture('empresa');
    const card = fixture.nativeElement.querySelector('app-semantic-card');
    expect(card).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Siguiente paso:');
  });

  it('con rol auditor muestra la tarjeta semantica con los pasos', () => {
    const fixture = createFixture('auditor');
    const card = fixture.nativeElement.querySelector('app-semantic-card');
    expect(card).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('¿Cómo funciona?');
    expect(fixture.nativeElement.querySelectorAll('.registro__card-steps li').length).toBe(4);
  });

  it('con rol viajero no muestra tarjeta semantica', () => {
    const fixture = createFixture('viajero');
    expect(fixture.nativeElement.querySelector('app-semantic-card')).toBeNull();
  });

  it('con campos vacios muestra el error de cada campo simultaneamente', async () => {
    const fixture = createFixture('viajero');

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
    const fixture = createFixture('viajero');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root, 'ana@ejemplo.com');
    setInputValue(root, 'input[autocomplete="email"]', 'abc');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorEmail()).toContain('correo electrónico');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('con contrasena que no cumple el patron muestra error y no llama al backend', async () => {
    const fixture = createFixture('viajero');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root, 'ana@ejemplo.com');
    setInputValue(root, 'input[placeholder="Tu contraseña"]', 'soloLetras');
    setInputValue(root, 'input[placeholder="Repite tu contraseña"]', 'soloLetras');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorContrasena()).toContain('al menos 8 caracteres');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('con contrasenas que no coinciden muestra el error en el campo de confirmacion', async () => {
    const fixture = createFixture('viajero');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root, 'ana@ejemplo.com');
    setInputValue(root, 'input[placeholder="Repite tu contraseña"]', 'Otra1234.');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorConfirmacion()).toContain('no coinciden');
    expect(comp.error()).toBe('');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('sin aceptar terminos muestra error junto al checkbox y no llama al backend', async () => {
    const fixture = createFixture('viajero');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root, 'ana@ejemplo.com');
    setChecked(root, false);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorTerminos()).toContain('Términos y Condiciones');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('rol viajero: datos validos llaman a registrarUsuarioConCorreo y navegan a validacion-pendiente', async () => {
    authService.registrarUsuarioConCorreo.mockReturnValue(
      of({ mensaje: 'Revisa tu correo', email: 'ana@ejemplo.com' })
    );

    const fixture = createFixture('viajero');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root, 'ana@ejemplo.com');

    await submitForm(fixture);

    expect(authService.registrarUsuarioConCorreo).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellidos: 'Perez Solano',
      email: 'ana@ejemplo.com',
      contrasena: 'Clave1234.',
      confirmarContrasena: 'Clave1234.',
      aceptaTerminos: true,
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/validacion-pendiente');
  });

  it('rol empresa: datos validos llaman a registrarEmpresaConCorreo con los campos renombrados y navegan a validacion-pendiente', async () => {
    authService.registrarEmpresaConCorreo.mockReturnValue(
      of({ mensaje: 'Revisa tu correo', email: 'ana@empresa.com' })
    );

    const fixture = createFixture('empresa');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root, 'ana@empresa.com');

    await submitForm(fixture);

    expect(authService.registrarEmpresaConCorreo).toHaveBeenCalledWith({
      nombreAdmin: 'Ana',
      apellidosAdmin: 'Perez Solano',
      emailAdmin: 'ana@empresa.com',
      contrasena: 'Clave1234.',
      confirmarContrasena: 'Clave1234.',
      aceptaTerminos: true,
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/validacion-pendiente');
  });

  it('rol auditor: datos validos llaman a registrarAuditorCorreo sin confirmarContrasena y navegan a validacion-pendiente', async () => {
    authService.registrarAuditorCorreo.mockReturnValue(
      of({ mensaje: 'Revisa tu correo', email: 'ana@auditor.com' })
    );

    const fixture = createFixture('auditor');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root, 'ana@auditor.com');

    await submitForm(fixture);

    expect(authService.registrarAuditorCorreo).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellidos: 'Perez Solano',
      email: 'ana@auditor.com',
      contrasena: 'Clave1234.',
      aceptaTerminos: true,
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/validacion-pendiente');
  });

  it('con un 409 del backend muestra el error en el campo de correo', async () => {
    authService.registrarUsuarioConCorreo.mockReturnValue(
      throwError(() => ({
        status: 409,
        error: { message: 'Ya existe una cuenta con este correo.' },
      }))
    );

    const fixture = createFixture('viajero');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root, 'ana@ejemplo.com');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorEmail()).toBe('Ya existe una cuenta con este correo.');
    expect(router.navigateByUrl).not.toHaveBeenCalledWith('/validacion-pendiente');
  });

  it('si el backend responde otro error, lo muestra como error general', async () => {
    authService.registrarUsuarioConCorreo.mockReturnValue(
      throwError(() => ({ status: 500, error: { message: 'Error del servidor.' } }))
    );

    const fixture = createFixture('viajero');
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root, 'ana@ejemplo.com');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.error()).toBe('Error del servidor.');
    expect(router.navigateByUrl).not.toHaveBeenCalledWith('/validacion-pendiente');
  });
});
