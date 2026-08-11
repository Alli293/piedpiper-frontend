import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ValidacionPendienteAuditorPageComponent } from './validacion-pendiente-auditor-page.component';
import {
  MiSolicitudAuditor,
  MiSolicitudAuditorService,
} from '../../../core/validacion/mi-solicitud-auditor.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionService } from '../../../core/auth-session.service';

describe('ValidacionPendienteAuditorPageComponent', () => {
  let fixture: ComponentFixture<ValidacionPendienteAuditorPageComponent>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let miSolicitudAuditorService: { obtener: ReturnType<typeof vi.fn> };
  let authService: { cerrarSesion: ReturnType<typeof vi.fn> };

  const solicitudPendiente: MiSolicitudAuditor = {
    estado: 'PENDIENTE',
    fechaSolicitud: '2026-06-28T00:00:00Z',
    fechaResolucion: null,
    motivoRechazo: null,
  };

  beforeEach(async () => {
    miSolicitudAuditorService = { obtener: vi.fn().mockReturnValue(of(solicitudPendiente)) };
    authService = { cerrarSesion: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ValidacionPendienteAuditorPageComponent],
      providers: [
        provideRouter([]),
        { provide: MiSolicitudAuditorService, useValue: miSolicitudAuditorService },
        {
          provide: AuthService,
          useValue: { ...authService, token: signal('fake-token') },
        },
        {
          provide: AuthSessionService,
          useValue: { getUserEmail: vi.fn().mockReturnValue('ana@correo.com') },
        },
      ],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(ValidacionPendienteAuditorPageComponent);
    fixture.detectChanges();
  });

  it('muestra el estado de la solicitud en revision', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('Tu cuenta está siendo revisada');
    expect(texto).toContain('ana@correo.com');
  });

  it('cerrar sesion limpia la sesion y navega a login', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const boton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button')
    ).find((b) => b.textContent?.includes('Cerrar sesión')) as HTMLButtonElement;
    boton.click();

    expect(authService.cerrarSesion).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('si falla la carga muestra un error', async () => {
    miSolicitudAuditorService.obtener.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture = TestBed.createComponent(ValidacionPendienteAuditorPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No pudimos cargar el estado de tu solicitud.'
    );
  });
});
