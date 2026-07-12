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

  function llenarFormularioValido(comp: any): void {
    comp.nombreAdmin.set('Ana');
    comp.apellidosAdmin.set('Perez Solano');
    comp.email.set('ana@empresa.com');
    comp.contrasena.set('clave1234');
    comp.confirmarContrasena.set('clave1234');
    comp.aceptaTerminos.set(true);
  }

  it('se crea', () => {
    const fixture = TestBed.createComponent(RegistroEmpresaFormComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('con campos vacios muestra error y no llama al backend', () => {
    const fixture = TestBed.createComponent(RegistroEmpresaFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.enviar(new Event('submit'));

    expect(comp.error()).toContain('nombre y apellidos');
    expect(authService.registrarEmpresaConCorreo).not.toHaveBeenCalled();
  });

  it('con contrasenas que no coinciden muestra el error en el campo de confirmacion', () => {
    const fixture = TestBed.createComponent(RegistroEmpresaFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);
    comp.confirmarContrasena.set('otra-clave');

    comp.enviar(new Event('submit'));

    expect(comp.errorConfirmacion()).toContain('no coinciden');
    expect(comp.error()).toBe('');
    expect(authService.registrarEmpresaConCorreo).not.toHaveBeenCalled();
  });

  it('sin aceptar terminos muestra error y no llama al backend', () => {
    const fixture = TestBed.createComponent(RegistroEmpresaFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);
    comp.aceptaTerminos.set(false);

    comp.enviar(new Event('submit'));

    expect(comp.error()).toContain('Términos y Condiciones');
    expect(authService.registrarEmpresaConCorreo).not.toHaveBeenCalled();
  });

  it('con datos validos llama a registrarEmpresaConCorreo y muestra pantalla de exito', () => {
    authService.registrarEmpresaConCorreo.mockReturnValue(
      of({ mensaje: 'Revisa tu correo', email: 'ana@empresa.com' })
    );

    const fixture = TestBed.createComponent(RegistroEmpresaFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);

    comp.enviar(new Event('submit'));

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

  it('si el backend responde error, lo muestra y no marca como enviado', () => {
    authService.registrarEmpresaConCorreo.mockReturnValue(
      throwError(() => ({ error: { message: 'Ya existe una cuenta con este correo.' } }))
    );

    const fixture = TestBed.createComponent(RegistroEmpresaFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);

    comp.enviar(new Event('submit'));

    expect(comp.error()).toBe('Ya existe una cuenta con este correo.');
    expect(comp.enviado()).toBe(false);
  });

  it('alternarContrasena y alternarConfirmar cambian la visibilidad de cada campo por separado', () => {
    const fixture = TestBed.createComponent(RegistroEmpresaFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.alternarContrasena();
    expect(comp.mostrarContrasena()).toBe(true);
    expect(comp.mostrarConfirmar()).toBe(false);

    comp.alternarConfirmar();
    expect(comp.mostrarConfirmar()).toBe(true);
  });
});
