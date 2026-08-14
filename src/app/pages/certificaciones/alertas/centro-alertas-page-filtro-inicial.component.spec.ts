import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { DashboardService } from '../../dashboard/dashboard.service';
import { CentroAlertasPageComponent } from './centro-alertas-page.component';

describe('CentroAlertasPageComponent - filtro inicial por queryParam', () => {
  let fixture: ComponentFixture<CentroAlertasPageComponent>;
  let filtroQueryParam: string | null = null;

  beforeEach(async () => {
    filtroQueryParam = null;
    await TestBed.configureTestingModule({
      imports: [CentroAlertasPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: { obtenerAlertas: vi.fn().mockReturnValue(of([])) },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            // Closure sobre `filtroQueryParam`: cada `it` lo reasigna antes de
            // llamar a `crear()`, asi que el mock siempre lee el valor vigente.
            snapshot: { queryParamMap: { get: (_key: string) => filtroQueryParam } },
          },
        },
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

  function crear(): void {
    fixture = TestBed.createComponent(CentroAlertasPageComponent);
    fixture.detectChanges();
  }

  it('filtro=VENCIDAS preselecciona el chip Vencidas', () => {
    filtroQueryParam = 'VENCIDAS';
    crear();
    expect((fixture.componentInstance as any).filtro()).toBe('VENCIDAS');
  });

  it('filtro=PROXIMAS preselecciona el chip Próximas', () => {
    filtroQueryParam = 'PROXIMAS';
    crear();
    expect((fixture.componentInstance as any).filtro()).toBe('PROXIMAS');
  });

  it('sin queryParam deja el filtro por defecto (TODAS)', () => {
    crear();
    expect((fixture.componentInstance as any).filtro()).toBe('TODAS');
  });

  it('un valor de filtro inválido cae al filtro por defecto (TODAS)', () => {
    filtroQueryParam = 'NO_EXISTE';
    crear();
    expect((fixture.componentInstance as any).filtro()).toBe('TODAS');
  });
});
