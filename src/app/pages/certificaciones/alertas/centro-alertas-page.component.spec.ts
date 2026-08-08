import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { DashboardService } from '../../dashboard/dashboard.service';
import { AlertaVencimiento } from '../../dashboard/dashboard.model';
import { CentroAlertasPageComponent } from './centro-alertas-page.component';

describe('CentroAlertasPageComponent', () => {
  let fixture: ComponentFixture<CentroAlertasPageComponent>;
  let dashboardService: { obtenerAlertas: ReturnType<typeof vi.fn> };

  const VENCIDA: AlertaVencimiento = {
    idCertificacion: 'c1',
    nombre: 'Bandera Azul Ecológica 2025',
    fechaVencimiento: '2026-06-04',
    diasRestantes: -24,
    urgencia: 'vencida',
  };

  const URGENTE: AlertaVencimiento = {
    idCertificacion: 'c2',
    nombre: 'GHG Protocol — Corporate Standard',
    fechaVencimiento: '2026-07-03',
    diasRestantes: 5,
    urgencia: '7_dias',
  };

  const PROXIMA: AlertaVencimiento = {
    idCertificacion: 'c3',
    nombre: 'Carbono Neutral — PPCN 2026',
    fechaVencimiento: '2026-07-28',
    diasRestantes: 30,
    urgencia: '30_dias',
  };

  async function createFixture(): Promise<ComponentFixture<CentroAlertasPageComponent>> {
    const created = TestBed.createComponent(CentroAlertasPageComponent);
    created.detectChanges();
    await created.whenStable();
    created.detectChanges();
    return created;
  }

  beforeEach(async () => {
    dashboardService = {
      obtenerAlertas: vi.fn().mockReturnValue(of([VENCIDA, URGENTE, PROXIMA])),
    };

    await TestBed.configureTestingModule({
      imports: [CentroAlertasPageComponent],
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

  it('carga y agrupa las alertas: vencidas primero, luego próximas a vencer', async () => {
    fixture = await createFixture();
    const el = fixture.nativeElement as HTMLElement;

    const nombres = Array.from(el.querySelectorAll('.ch-centro-alertas__fila-nombre')).map((n) =>
      n.textContent?.trim()
    );
    expect(nombres).toEqual([
      'Bandera Azul Ecológica 2025',
      'GHG Protocol — Corporate Standard',
      'Carbono Neutral — PPCN 2026',
    ]);
  });

  it('filtra por urgencia al seleccionar un chip', async () => {
    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    const chips = Array.from(el.querySelectorAll('.ch-filter-chips__item'));
    const chipVencidas = chips.find((chip) => chip.textContent?.includes('Vencidas')) as
      HTMLButtonElement | undefined;
    chipVencidas?.click();
    fixture.detectChanges();

    const nombres = Array.from(el.querySelectorAll('.ch-centro-alertas__fila-nombre')).map((n) =>
      n.textContent?.trim()
    );
    expect(nombres).toEqual(['Bandera Azul Ecológica 2025']);
  });

  it('filtra por nombre con el buscador', async () => {
    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    const buscador = el.querySelector(
      'input[placeholder="Buscar certificación..."]'
    ) as HTMLInputElement;
    buscador.value = 'GHG';
    buscador.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const nombres = Array.from(el.querySelectorAll('.ch-centro-alertas__fila-nombre')).map((n) =>
      n.textContent?.trim()
    );
    expect(nombres).toEqual(['GHG Protocol — Corporate Standard']);
  });

  it('muestra el estado "Todo en regla" cuando no hay alertas', async () => {
    dashboardService.obtenerAlertas.mockReturnValue(of([]));
    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-centro-alertas__vacio')?.textContent).toContain(
      'No hay alertas activas en este momento.'
    );
  });

  it('muestra el mensaje de error cuando falla la carga', async () => {
    dashboardService.obtenerAlertas.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-centro-alertas__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
  });

  it('cada alerta enlaza a la vista de detalle de su certificación', async () => {
    fixture = await createFixture();
    const el = fixture.nativeElement as HTMLElement;
    const enlace = el.querySelector('.ch-centro-alertas__ver-detalle') as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toBe('/empresa/certificaciones/c1');
  });
});
