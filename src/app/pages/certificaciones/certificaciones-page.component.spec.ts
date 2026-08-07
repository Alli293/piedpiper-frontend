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
import { EmpresaService } from '../../core/empresa/empresa.service';
import { InsigniaEmpresa } from '../../core/empresa/empresa.models';
import { CertificacionesPageComponent } from './certificaciones-page.component';
import { DashboardService } from '../dashboard/dashboard.service';
import {
  AlertaVencimiento,
  CalendarioVencimientosResponse,
  ResumenCertificacionesDashboardResponse,
} from '../dashboard/dashboard.model';
import { MetaReduccion } from '../metas/metas.model';
import { MetasService } from '../metas/metas.service';

describe('CertificacionesPageComponent', () => {
  let fixture: ComponentFixture<CertificacionesPageComponent>;
  let dashboardService: {
    obtenerResumenCertificaciones: ReturnType<typeof vi.fn>;
    obtenerCalendarioVencimientos: ReturnType<typeof vi.fn>;
    obtenerAlertas: ReturnType<typeof vi.fn>;
  };
  let empresaService: {
    listarInsignias: ReturnType<typeof vi.fn>;
  };
  let metasService: {
    listarMetas: ReturnType<typeof vi.fn>;
  };

  const RESUMEN: ResumenCertificacionesDashboardResponse = {
    activas: 5,
    proximasAVencer: 3,
    vencidas: 1,
  };

  const INSIGNIA: InsigniaEmpresa = {
    idInsignia: 1,
    nivelInsignia: 'oro',
    nombre: 'Carbono Neutral 2026',
    descripcion: 'Reconocimiento por neutralidad de carbono.',
    fechaObtencion: '2026-04-12T00:00:00Z',
  };

  const ALERTA: AlertaVencimiento = {
    idCertificacion: 'c1',
    nombre: 'Bandera Azul Ecológica 2025',
    fechaVencimiento: '2026-06-04',
    diasRestantes: -24,
    urgencia: 'vencida',
  };

  const META: MetaReduccion = {
    id: 'm1',
    nombreMeta: 'Reducir huella total a 4,200 tCO2e',
    valorObjetivoHuellaT: 4200,
    fechaLimite: '2027-12-31',
    huellaActualT: 3024,
    progresoPorcentaje: 72,
    vencida: false,
    fechaCreacion: '2026-01-01T00:00:00Z',
  };

  // El componente pide el calendario del mes actual REAL (usa `new Date()`), así
  // que el mock tiene que calzar con eso en vez de una fecha fija — de lo
  // contrario el test pasa solo por coincidencia en la máquina/fecha donde se
  // corra (fue justo lo que rompió en CI).
  function mesActualIso(): string {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    return `${hoy.getFullYear()}-${mes < 10 ? `0${mes}` : mes}`;
  }

  const MES_ACTUAL = mesActualIso();
  const FECHA_CON_VENCIMIENTO = `${MES_ACTUAL}-15`;

  const CALENDARIO: CalendarioVencimientosResponse = {
    mesVisualizado: MES_ACTUAL,
    vencimientosPorFecha: {
      [FECHA_CON_VENCIMIENTO]: [{ id: 'c1', nombre: 'Carbono Neutral', urgencia: '30_dias' }],
    },
  };

  async function createFixture(): Promise<ComponentFixture<CertificacionesPageComponent>> {
    const created = TestBed.createComponent(CertificacionesPageComponent);
    created.detectChanges();
    await created.whenStable();
    created.detectChanges();
    return created;
  }

  beforeEach(async () => {
    dashboardService = {
      obtenerResumenCertificaciones: vi.fn().mockReturnValue(of(RESUMEN)),
      obtenerCalendarioVencimientos: vi.fn().mockReturnValue(of(CALENDARIO)),
      obtenerAlertas: vi.fn().mockReturnValue(of([ALERTA])),
    };
    empresaService = {
      listarInsignias: vi.fn().mockReturnValue(of([INSIGNIA])),
    };
    metasService = {
      listarMetas: vi.fn().mockReturnValue(of([META])),
    };

    await TestBed.configureTestingModule({
      imports: [CertificacionesPageComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardService },
        { provide: EmpresaService, useValue: empresaService },
        { provide: MetasService, useValue: metasService },
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
    expect(el.querySelector('.ch-certificaciones__listado-link')).toBeTruthy();
  });

  it('carga el calendario del mes actual al iniciar', async () => {
    fixture = await createFixture();
    expect(dashboardService.obtenerCalendarioVencimientos).toHaveBeenCalledOnce();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.ch-calendario__day--con-vencimiento').length).toBe(1);
  });

  it('al navegar de mes en el calendario, vuelve a pedir los datos del nuevo mes', async () => {
    fixture = await createFixture();
    dashboardService.obtenerCalendarioVencimientos.mockReturnValue(
      of({ mesVisualizado: '2026-08', vencimientosPorFecha: {} })
    );

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('[aria-label="Mes siguiente"]') as HTMLButtonElement)?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dashboardService.obtenerCalendarioVencimientos).toHaveBeenCalledTimes(2);
    const ultimoMesConsultado =
      dashboardService.obtenerCalendarioVencimientos.mock.calls.at(-1)?.[0];
    expect(ultimoMesConsultado).toMatch(/^\d{4}-\d{2}$/);
  });

  it('un fallo en el calendario no afecta al bloque de estado de certificaciones', async () => {
    dashboardService.obtenerCalendarioVencimientos.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-calendario__error')).toBeTruthy();
    expect(el.querySelectorAll('.ch-estado-cert__card-value').length).toBe(3);
  });

  it('carga las insignias empresariales al iniciar', async () => {
    fixture = await createFixture();
    expect(empresaService.listarInsignias).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-insignias-panel__item-copy strong')?.textContent).toContain(
      'Carbono Neutral 2026'
    );
  });

  it('un fallo en las insignias no afecta a los demás bloques de la página', async () => {
    empresaService.listarInsignias.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-insignias-panel__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
    expect(el.querySelectorAll('.ch-estado-cert__card-value').length).toBe(3);
  });

  it('carga las alertas activas al iniciar', async () => {
    fixture = await createFixture();
    expect(dashboardService.obtenerAlertas).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-alertas-panel__item-nombre strong')?.textContent).toContain(
      'Bandera Azul Ecológica 2025'
    );
  });

  it('un fallo en las alertas no afecta a los demás bloques de la página', async () => {
    dashboardService.obtenerAlertas.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-alertas-panel__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
    expect(el.querySelectorAll('.ch-estado-cert__card-value').length).toBe(3);
  });

  it('carga las metas de reducción al iniciar', async () => {
    fixture = await createFixture();
    expect(metasService.listarMetas).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-metas-panel__item-copy strong')?.textContent).toContain(
      'Reducir huella total a 4,200 tCO2e'
    );
  });

  it('un fallo en las metas no afecta a los demás bloques de la página', async () => {
    metasService.listarMetas.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-metas-panel__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
    expect(el.querySelectorAll('.ch-estado-cert__card-value').length).toBe(3);
  });
});
