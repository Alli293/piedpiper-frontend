import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { RegistroRolPageComponent } from './registro-rol-page.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';

describe('RegistroRolPageComponent', () => {
  let authService: {
    registrarConGoogle: ReturnType<typeof vi.fn>;
    registrarEmpresaConCorreo: ReturnType<typeof vi.fn>;
    registrarUsuarioConCorreo: ReturnType<typeof vi.fn>;
  };
  let googleIdentity: { renderizarBoton: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = {
      registrarConGoogle: vi.fn().mockReturnValue(of({})),
      registrarEmpresaConCorreo: vi.fn(),
      registrarUsuarioConCorreo: vi.fn(),
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

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('mapea el rol empresa al badge correcto', () => {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', 'empresa');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('app-badge');
    expect(badge.textContent.trim()).toBe('EMPRESA · ADMINISTRADOR');
  });

  it('mapea el rol auditor al badge correcto', () => {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', 'auditor');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('app-badge');
    expect(badge.textContent.trim()).toBe('AUDITOR CERTIFICADO');
  });

  it('con un rol invalido no renderiza la tarjeta de registro', () => {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', 'inventado');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-badge')).toBeNull();
  });

  it('con rol empresa renderiza el formulario embebido de registro por correo', () => {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', 'empresa');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-registro-empresa-form')).not.toBeNull();
  });

  it('con rol auditor no renderiza el formulario de registro por correo', () => {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', 'auditor');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-registro-empresa-form')).toBeNull();
  });

  it('con rol viajero renderiza el formulario embebido de registro de usuario', () => {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', 'viajero');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-registro-usuario-form')).not.toBeNull();
  });

  it('con rol empresa no renderiza el formulario de registro de usuario', () => {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', 'empresa');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-registro-usuario-form')).toBeNull();
  });
});
