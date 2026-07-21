import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';

describe('LoginPageComponent', () => {
  let authService: {
    loginConCorreo: ReturnType<typeof vi.fn>;
    loginConGoogle: ReturnType<typeof vi.fn>;
  };
  let googleIdentity: { renderizarBoton: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { loginConCorreo: vi.fn(), loginConGoogle: vi.fn() };
    googleIdentity = { renderizarBoton: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: GoogleIdentityService, useValue: googleIdentity },
      ],
    }).compileComponents();
  });

  it('se crea', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('con campos vacios muestra error y no llama al backend', async () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.enviar(new Event('submit'));
    await fixture.whenStable();

    expect(comp.error()).toContain('Ingresa tu correo y contraseña.');
    expect(authService.loginConCorreo).not.toHaveBeenCalled();
  });

  it('con credenciales llama a loginConCorreo y navega al redirect', async () => {
    authService.loginConCorreo.mockReturnValue(
      of({ token: 't', rol: 'USUARIO_INDIVIDUAL', estado: 'ACTIVO', redirect: '/panel' })
    );
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    comp.model.update((m: any) => ({ ...m, email: 'a@b.com', contrasena: 'secreta' }));

    comp.enviar(new Event('submit'));
    await fixture.whenStable();

    expect(authService.loginConCorreo).toHaveBeenCalledWith('a@b.com', 'secreta');
    expect(navegar).toHaveBeenCalledWith('/panel');
  });
});
