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

  function llenarFormularioValido(comp: any): void {
    comp.nombre.set('Ana');
    comp.apellidos.set('Perez Solano');
    comp.email.set('ana@ejemplo.com');
    comp.contrasena.set('clave1234');
    comp.confirmarContrasena.set('clave1234');
    comp.aceptaTerminos.set(true);
  }

  it('se crea', () => {
    const fixture = TestBed.createComponent(RegistroUsuarioFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('con campos vacios muestra el error de cada campo simultaneamente, no solo el primero', () => {
    const fixture = TestBed.createComponent(RegistroUsuarioFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.enviar(new Event('submit'));

    expect(comp.errorNombre()).toContain('Ingresa tu nombre');
    expect(comp.errorApellidos()).toContain('Ingresa tus apellidos');
    expect(comp.errorEmail()).toContain('correo electrónico');
    expect(comp.errorContrasena()).toContain('contraseña');
    expect(comp.errorConfirmacion()).toContain('confirmar tu contraseña');
    expect(comp.error()).toContain('Términos y Condiciones');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('con contrasenas que no coinciden muestra el error en el campo de confirmacion', () => {
    const fixture = TestBed.createComponent(RegistroUsuarioFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);
    comp.confirmarContrasena.set('otra-clave');

    comp.enviar(new Event('submit'));

    expect(comp.errorConfirmacion()).toContain('no coinciden');
    expect(comp.error()).toBe('');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('sin aceptar terminos muestra error y no llama al backend', () => {
    const fixture = TestBed.createComponent(RegistroUsuarioFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);
    comp.aceptaTerminos.set(false);

    comp.enviar(new Event('submit'));

    expect(comp.error()).toContain('Términos y Condiciones');
    expect(authService.registrarUsuarioConCorreo).not.toHaveBeenCalled();
  });

  it('con datos validos llama a registrarUsuarioConCorreo y muestra pantalla de exito', () => {
    authService.registrarUsuarioConCorreo.mockReturnValue(
      of({ mensaje: 'Revisa tu correo', email: 'ana@ejemplo.com' })
    );

    const fixture = TestBed.createComponent(RegistroUsuarioFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);

    comp.enviar(new Event('submit'));

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

  it('si el backend responde error, lo muestra y no marca como enviado', () => {
    authService.registrarUsuarioConCorreo.mockReturnValue(
      throwError(() => ({ error: { message: 'Ya existe una cuenta con este correo.' } }))
    );

    const fixture = TestBed.createComponent(RegistroUsuarioFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);

    comp.enviar(new Event('submit'));

    expect(comp.error()).toBe('Ya existe una cuenta con este correo.');
    expect(comp.enviado()).toBe(false);
  });

  it('alternarContrasena y alternarConfirmar cambian la visibilidad de cada campo por separado', () => {
    const fixture = TestBed.createComponent(RegistroUsuarioFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.alternarContrasena();
    expect(comp.mostrarContrasena()).toBe(true);
    expect(comp.mostrarConfirmar()).toBe(false);

    comp.alternarConfirmar();
    expect(comp.mostrarConfirmar()).toBe(true);
  });
});
