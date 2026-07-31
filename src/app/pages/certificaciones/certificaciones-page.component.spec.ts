import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../core/auth-session.service';
import { AuthService } from '../../core/auth/auth.service';
import { SesionInactividadService } from '../../core/auth/sesion-inactividad.service';
import { PerfilInicialService } from '../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../core/models/perfil-inicial.model';
import { CertificacionesPageComponent } from './certificaciones-page.component';
import { DashboardService } from '../dashboard/dashboard.service';
import { ResumenCertificacionesDashboardResponse } from '../dashboard/dashboard.model';

describe('CertificacionesPageComponent', () => {
  let fixture: ComponentFixture<CertificacionesPageComponent>;
  let dashboardService: { obtenerResumenCertificaciones: ReturnType<typeof vi.fn> };

  const RESUMEN: ResumenCertificacionesDashboardResponse = {
    activas: 5,
    proximasAVencer: 3,
    vencidas: 1,
  };

  async function createFixture(): Promise<ComponentFixture<CertificacionesPageComponent>> {
    const created = TestBed.createComponent(CertificacionesPageComponent);
    created.detectChanges();
    await created.whenStable();
    created.detectChanges();
    return created;
  }

  beforeEach(async () => {
    dashboardService = { obtenerResumenCertificaciones: vi.fn().mockReturnValue(of(RESUMEN)) };

    await TestBed.configureTestingModule({
      imports: [CertificacionesPageComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardService },
        {
          provide: AuthSessionService,
          useValue: {
            isAdministradorEmpresa: () => true,
            getRole: vi.fn().mockReturnValue('administrador_empresa'),
            getUserName: vi.fn().mockReturnValue('Admin'),
            getUserInitials: vi.fn().mockReturnValue('AD'),
            getUserEmail: vi.fn().mockReturnValue('admin@test.com'),
            getUserId: vi.fn().mockReturnValue('123'),
          },
        },
        {
          provide: AuthService,
          useValue: { token: signal('fake-token'), cerrarSesion: vi.fn() },
        },
        {
          provide: SesionInactividadService,
          useValue: { reiniciar: vi.fn(), detener: vi.fn() },
        },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();
  });

  it('carga el resumen de certificaciones al iniciar', async () => {
    fixture = await createFixture();
    expect(dashboardService.obtenerResumenCertificaciones).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    const valores = Array.from(el.querySelectorAll('.ch-estado-cert__card-value')).map((n) =>
      n.textContent?.trim()
    );
    expect(valores).toEqual(['5', '3', '1']);
  });

  it('muestra el mensaje de error del bloque sin romper el resto de la página si falla la carga', async () => {
    dashboardService.obtenerResumenCertificaciones.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-estado-cert__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
    expect(el.querySelector('.ch-certificaciones__placeholder')).toBeTruthy();
  });
});
