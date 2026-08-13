import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilPublicoAuditorResponse } from '../../../core/models/perfil-publico-auditor.model';
import { PerfilPublicoAuditorService } from '../../../core/perfil-auditor/perfil-publico-auditor.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PerfilPublicoAuditorPageComponent } from './perfil-publico-auditor-page.component';

const AUDITOR_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const PERFIL_COMPLETO: PerfilPublicoAuditorResponse = {
  auditorId: AUDITOR_ID,
  nombre: 'Carlos Méndez Solano',
  fotoPerfil: 'https://storage.example.com/foto.jpg',
  descripcionProfesional: 'Auditor con 10 años de experiencia en huella de carbono.',
  especialidades: ['HUELLA_CARBONO', 'ENERGIA_RENOVABLE'],
  certificaciones: [
    {
      nombre: 'ISO 14064',
      entidadCertificadora: 'SGS',
      fechaVigencia: '2026-12-31',
      vencida: false,
    },
    {
      nombre: 'ISO 14001',
      entidadCertificadora: 'Bureau Veritas',
      fechaVigencia: '2024-01-15',
      vencida: true,
    },
  ],
  disponible: true,
  calificacionPromedio: 4.5,
  totalResenas: 12,
  auditoriasCompletadas: 8,
  tiempoPromedioRespuestaDias: 2.3,
  distribucionSectores: [
    { sector: 'Energía', porcentaje: 45.0 },
    { sector: 'Manufactura', porcentaje: 30.0 },
    { sector: 'Transporte', porcentaje: 25.0 },
  ],
  resenas: [
    {
      calificacion: 5.0,
      comentario: 'Excelente trabajo, muy profesional.',
      fechaCalificacion: '2025-06-01',
    },
    {
      calificacion: 4.0,
      comentario: 'Buen servicio, puntual.',
      fechaCalificacion: '2025-03-15',
    },
  ],
};

describe('PerfilPublicoAuditorPageComponent', () => {
  let fixture: ComponentFixture<PerfilPublicoAuditorPageComponent>;
  let perfilService: { obtenerPerfilPublico: ReturnType<typeof vi.fn> };
  let toastService: ToastService;
  let authSessionStub: {
    isAdministradorEmpresa: ReturnType<typeof vi.fn>;
    getRole: ReturnType<typeof vi.fn>;
    getUserName: ReturnType<typeof vi.fn>;
    getUserInitials: ReturnType<typeof vi.fn>;
    getUserId: ReturnType<typeof vi.fn>;
  };

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function estabilizar(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function configurarAuthSession(esAdmin: boolean): void {
    authSessionStub.isAdministradorEmpresa.mockReturnValue(esAdmin);
    authSessionStub.getRole.mockReturnValue(
      esAdmin ? 'administrador_empresa' : 'usuario_general_empresa'
    );
  }

  beforeEach(async () => {
    perfilService = {
      obtenerPerfilPublico: vi.fn().mockReturnValue(of(PERFIL_COMPLETO)),
    };

    authSessionStub = {
      isAdministradorEmpresa: vi.fn().mockReturnValue(false),
      getRole: vi.fn().mockReturnValue('usuario_general_empresa'),
      getUserName: vi.fn().mockReturnValue('Test User'),
      getUserInitials: vi.fn().mockReturnValue('TU'),
      getUserId: vi.fn().mockReturnValue('user-1'),
    };

    await TestBed.configureTestingModule({
      imports: [PerfilPublicoAuditorPageComponent],
      providers: [
        provideRouter([]),
        ToastService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (_key: string) => AUDITOR_ID } },
          },
        },
        { provide: PerfilPublicoAuditorService, useValue: perfilService },
        { provide: AuthSessionService, useValue: authSessionStub },
        { provide: AuthService, useValue: { token: signal('fake-token'), cerrarSesion: vi.fn() } },
        { provide: SesionInactividadService, useValue: { reiniciar: vi.fn(), detener: vi.fn() } },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();

    toastService = TestBed.inject(ToastService);
  });

  describe('estado de carga', () => {
    it('muestra spinner durante carga y oculta secciones del perfil', () => {
      // Hacemos que el observable nunca emita para simular estado de carga permanente
      perfilService.obtenerPerfilPublico.mockReturnValue(new Subject());

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      fixture.detectChanges();

      expect(raiz().querySelector('.ch-perfil-auditor__loading')).not.toBeNull();
      expect(raiz().querySelector('.ch-perfil-auditor__spinner')).not.toBeNull();
      expect(raiz().querySelector('.ch-perfil-auditor')).toBeNull();
    });
  });

  describe('perfil completo renderizado', () => {
    beforeEach(async () => {
      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();
    });

    it('renderiza nombre del auditor', () => {
      expect(raiz().textContent).toContain('Carlos Méndez Solano');
    });

    it('renderiza descripción profesional', () => {
      expect(raiz().textContent).toContain('Auditor con 10 años de experiencia');
    });

    it('renderiza especialidades', () => {
      expect(raiz().textContent).toContain('Huella Carbono');
      expect(raiz().textContent).toContain('Energia Renovable');
    });

    it('renderiza certificaciones con etiqueta vencida', () => {
      expect(raiz().textContent).toContain('ISO 14064');
      expect(raiz().textContent).toContain('ISO 14001');
      expect(raiz().textContent).toContain('VENCIDA');
      expect(raiz().textContent).toContain('VIGENTE');
    });

    it('renderiza métricas de reputación', () => {
      expect(raiz().textContent).toContain('8');
      expect(raiz().textContent).toContain('2.3');
    });

    it('renderiza distribución de sectores', () => {
      expect(raiz().textContent).toContain('Energía');
      expect(raiz().textContent).toContain('45');
      expect(raiz().textContent).toContain('Manufactura');
      expect(raiz().textContent).toContain('Transporte');
    });

    it('renderiza reseñas verificadas', () => {
      expect(raiz().textContent).toContain('Excelente trabajo, muy profesional.');
      expect(raiz().textContent).toContain('Buen servicio, puntual.');
    });

    it('no muestra spinner cuando el perfil está cargado', () => {
      expect(raiz().querySelector('.ch-perfil-auditor__loading')).toBeNull();
    });
  });

  describe('métricas null muestra "Sin datos suficientes"', () => {
    it('muestra texto indicativo cuando métricas son null', async () => {
      perfilService.obtenerPerfilPublico.mockReturnValue(
        of({
          ...PERFIL_COMPLETO,
          calificacionPromedio: null,
          totalResenas: null,
          auditoriasCompletadas: null,
          tiempoPromedioRespuestaDias: null,
        })
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      // Cuando métricas son null, los KPIs muestran "—" (dash)
      const kpis = raiz().querySelectorAll('.ch-perfil-auditor__kpi-value');
      const kpiTexts = Array.from(kpis).map((el) => el.textContent?.trim());
      expect(kpiTexts.some((t) => t === '—')).toBe(true);
    });
  });

  describe('especialidades vacías', () => {
    it('muestra "Sin especialidades registradas" cuando la lista está vacía', async () => {
      perfilService.obtenerPerfilPublico.mockReturnValue(
        of({ ...PERFIL_COMPLETO, especialidades: [] })
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      expect(raiz().textContent).toContain('Sin especialidades registradas');
    });
  });

  describe('distribucionSectores vacío', () => {
    it('no muestra sección de distribución de sectores cuando está vacía', async () => {
      perfilService.obtenerPerfilPublico.mockReturnValue(
        of({ ...PERFIL_COMPLETO, distribucionSectores: [] })
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      // Cuando distribucionSectores está vacío, la sección no se renderiza
      expect(raiz().querySelector('.ch-perfil-auditor__dist')).toBeNull();
    });
  });

  describe('reseñas vacías', () => {
    it('muestra "Este auditor aún no tiene reseñas" cuando la lista está vacía', async () => {
      perfilService.obtenerPerfilPublico.mockReturnValue(of({ ...PERFIL_COMPLETO, resenas: [] }));

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      expect(raiz().textContent).toContain('Este auditor aún no tiene reseñas');
    });
  });

  describe('error HTTP 404', () => {
    it('muestra mensaje de error y botón "Volver al directorio"', async () => {
      perfilService.obtenerPerfilPublico.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              statusText: 'Not Found',
              error: { message: 'El perfil solicitado no está disponible.' },
            })
        )
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      expect(raiz().textContent).toContain('El perfil solicitado no está disponible.');
      const botonVolver = raiz().querySelector('.ch-perfil-auditor__error-btn') as HTMLElement;
      expect(botonVolver).not.toBeNull();
      expect(botonVolver.textContent).toContain('Volver al directorio');
    });
  });

  describe('error HTTP 5xx', () => {
    it('muestra toast con mensaje correcto', async () => {
      perfilService.obtenerPerfilPublico.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              statusText: 'Internal Server Error',
              error: { message: 'Server error' },
            })
        )
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const mensajes = toastService.toasts().map((t) => t.title);
      expect(mensajes).toContain('No se pudo cargar el perfil del auditor. Intente nuevamente.');
    });
  });

  describe('botón "Asignar auditoría" - visibilidad por rol', () => {
    it('muestra botón de asignación para administrador_empresa', async () => {
      configurarAuthSession(true);

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const botonAsignar = raiz().querySelector('.ch-perfil-auditor__hire-btn') as HTMLElement;
      expect(botonAsignar).not.toBeNull();
    });

    it('no renderiza botón de asignación en el DOM para otros roles', async () => {
      configurarAuthSession(false);

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const botonAsignar = raiz().querySelector('.ch-perfil-auditor__hire-btn');
      expect(botonAsignar).toBeNull();
    });

    it('al hacer click en el botón navega a /empresa/auditorias/nueva con auditorId', async () => {
      configurarAuthSession(true);

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      const botonAsignar = raiz().querySelector('.ch-perfil-auditor__hire-btn') as HTMLElement;
      botonAsignar.click();
      await fixture.whenStable();

      expect(navigateSpy).toHaveBeenCalledWith(['/empresa/auditorias/nueva'], {
        queryParams: { auditorId: AUDITOR_ID },
      });
    });
  });
});
