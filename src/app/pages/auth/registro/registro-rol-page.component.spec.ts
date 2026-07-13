import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { RegistroRolPageComponent } from './registro-rol-page.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';

describe('RegistroRolPageComponent', () => {
  let authService: { registrarConGoogle: ReturnType<typeof vi.fn> };
  let googleIdentity: { renderizarBoton: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { registrarConGoogle: vi.fn().mockReturnValue(of({})) };
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

    const badge = fixture.nativeElement.querySelector('.registro__badge');
    expect(badge.textContent.trim()).toBe('EMPRESA · ADMINISTRADOR');
  });

  it('mapea el rol auditor al badge correcto', () => {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', 'auditor');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.registro__badge');
    expect(badge.textContent.trim()).toBe('AUDITOR CERTIFICADO');
  });

  it('con un rol invalido no renderiza la tarjeta de registro', () => {
    const fixture = TestBed.createComponent(RegistroRolPageComponent);
    fixture.componentRef.setInput('rol', 'inventado');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.registro__badge')).toBeNull();
  });
});
