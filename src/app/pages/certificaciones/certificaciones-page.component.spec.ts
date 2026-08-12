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
import { CertificacionResumen } from '../../core/models/certificacion.model';
import { CertificacionesService } from '../../core/services/certificaciones.service';
import { CertificacionesPageComponent } from './certificaciones-page.component';
import { DashboardService } from '../dashboard/dashboard.service';
import {
  CalendarioVencimientosResponse,
  RecomendacionRenovacion,
  ResumenCertificacionesDashboardResponse,
} from '../dashboard/dashboard.model';
import { MetaReduccion } from '../metas/metas.model';
import { MetasService } from '../metas/metas.service';

describe('CertificacionesPageComponent', () => {
  let fixture: ComponentFixture<CertificacionesPageComponent>;
  let dashboardService: {
    obtenerResumenCertificaciones: ReturnType<typeof vi.fn>;
    obtenerCalendarioVencimientos: ReturnType<typeof vi.fn>;
    obtenerRecomendacion: ReturnType<typeof vi.fn>;
  };
  let empresaService: {
    listarInsignias: ReturnType<typeof vi.fn>;
  };
  let certificacionesService: {
    listar: ReturnType<typeof vi.fn>;
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

  const CERTIFICACION: CertificacionResumen = {
    id: 'c1',
    idAuditoria: 'a1',
    idEmpresa: 'e1',
    idAuditor: 'aud1',
    tipo: 'CARBONO_NEUTRAL',
    nombreCertificacion: 'Bandera Azul Ecológica 2025',
    fechaEmision: '2026-06-04T00:00:00Z',
    fechaVencimiento: '2027-06-04T00:00:00Z',
    estado: 'ACTIVA',
    vigente: true,
    urlVerificacion: 'https://example.cr/verificar/c1',
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

  const RECOMENDACION: RecomendacionRenovacion = {
    idCertificacion: 'c1',
    nombreCertificacion: 'GHG Protocol — Corporate Standard',
    fechaVencimiento: '2026-07-03',
    diasRestantes: 5,
    impactoHuellaT: 120.5,
    justificacion: 'Vence en 5 días y respalda 3 de tus insignias activas.',
    sugerenciaAccion: 'Renovarla ahora evita perder tu nivel Oro.',
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
      obtenerRecomendacion: vi.fn().mockReturnValue(of(RECOMENDACION)),
    };
    empresaService = {
      listarInsignias: vi.fn().mockReturnValue(of([INSIGNIA])),
    };
    certificacionesService = {
      listar: vi.fn().mockReturnValue(of([CERTIFICACION])),
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
        { provide: CertificacionesService, useValue: certificacionesService },
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
    expect(el.querySelector('.ch-cert-recientes-panel')).toBeTruthy();
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

  it('carga las insignias empresariales al iniciar (una sola vez)', async () => {
    fixture = await createFixture();
    expect(empresaService.listarInsignias).toHaveBeenCalledTimes(1);
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

  it('carga las certificaciones recientes al iniciar', async () => {
    fixture = await createFixture();
    expect(certificacionesService.listar).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-cert-recientes-panel__item-copy strong')?.textContent).toContain(
      'Bandera Azul Ecológica 2025'
    );
  });

  it('un fallo en las certificaciones recientes no afecta a los demás bloques de la página', async () => {
    certificacionesService.listar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-cert-recientes-panel__error')?.textContent).toContain(
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

  it('muestra la recomendación de renovación junto al estado de certificaciones', async () => {
    fixture = await createFixture();
    expect(dashboardService.obtenerRecomendacion).toHaveBeenCalled();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-recomendacion-panel__cert strong')?.textContent).toContain(
      'GHG Protocol — Corporate Standard'
    );
  });

  it('no muestra el bloque de recomendación si no hay certificaciones con alerta activa', async () => {
    dashboardService.obtenerRecomendacion.mockReturnValue(of(null));

    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-recomendacion-panel')).toBeNull();
    // El resto de la página sigue funcionando normalmente.
    expect(el.querySelectorAll('.ch-estado-cert__card-value').length).toBe(3);
  });

  it('un fallo en la recomendación no afecta a los demás bloques de la página', async () => {
    dashboardService.obtenerRecomendacion.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    fixture = await createFixture();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-recomendacion-panel__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
    expect(el.querySelectorAll('.ch-estado-cert__card-value').length).toBe(3);
  });
});
