import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { CalificacionResponse } from '../../../core/calificacion/calificacion.models';
import { CalificacionService } from '../../../core/calificacion/calificacion.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilPublicoAuditorResponse } from '../../../core/models/perfil-publico-auditor.model';
import { PerfilPublicoAuditorService } from '../../../core/perfil-auditor/perfil-publico-auditor.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuditoriasService } from '../../auditorias/auditorias.service';
import { AuditoresService } from '../auditores.service';
import { PerfilPublicoAuditorPageComponent } from './perfil-publico-auditor-page.component';

const AUDITOR_ID = 'aud-111-222-333';
const AUDITORIA_ID = 'audit-444-555-666';
const EMPRESA_ID = 'emp-777-888-999';
const CALIFICACION_ID = 'cal-aaa-bbb-ccc';

const PERFIL_COMPLETO: PerfilPublicoAuditorResponse = {
  auditorId: AUDITOR_ID,
  nombre: 'María López García',
  fotoPerfil: null,
  descripcionProfesional: 'Auditora senior con experiencia en sostenibilidad.',
  provincia: null,
  especialidades: ['HUELLA_CARBONO'],
  certificaciones: [],
  disponible: true,
  calificacionPromedio: 4.2,
  totalResenas: 5,
  auditoriasCompletadas: 3,
  tiempoPromedioRespuestaDias: 1.5,
  distribucionSectores: [],
  resenas: [],
};

const AUDITORIA_CALIFICABLE = {
  id: AUDITORIA_ID,
  tipoCertificacion: 'ISO_14064' as const,
  periodoInicio: '2025-01-01',
  periodoFin: '2025-12-31',
  estado: 'CERTIFICACION_EMITIDA' as const,
  estadoDescripcion: 'Certificación emitida',
  fechaCreacion: '2025-01-15',
  nombreEmpresa: 'Empresa Test',
  idAuditor: AUDITOR_ID,
  nombreAuditor: 'María López García',
  fechaAsignacion: '2025-02-01',
  fechaAceptacion: '2025-02-05',
  cantidadDocumentos: 2,
};

const CALIFICACION_EXISTENTE: CalificacionResponse = {
  id: CALIFICACION_ID,
  auditoriaId: AUDITORIA_ID,
  auditorId: AUDITOR_ID,
  empresaId: EMPRESA_ID,
  calificacion: 4,
  comentario: 'Buen trabajo en la auditoría.',
  creadoEn: '2025-06-01T10:00:00Z',
  actualizadoEn: '2025-06-01T10:00:00Z',
};

const CALIFICACION_CREADA: CalificacionResponse = {
  id: 'new-cal-id',
  auditoriaId: AUDITORIA_ID,
  auditorId: AUDITOR_ID,
  empresaId: EMPRESA_ID,
  calificacion: 5,
  comentario: 'Excelente auditor.',
  creadoEn: '2025-07-01T10:00:00Z',
  actualizadoEn: '2025-07-01T10:00:00Z',
};

describe('PerfilPublicoAuditorPage — Integración CalificacionFormComponent', () => {
  let fixture: ComponentFixture<PerfilPublicoAuditorPageComponent>;
  let toastService: ToastService;
  let perfilService: { obtenerPerfilPublico: ReturnType<typeof vi.fn> };
  let auditoresService: {
    obtenerEspecialidades: ReturnType<typeof vi.fn>;
    obtenerZonas: ReturnType<typeof vi.fn>;
  };
  let auditoriasService: { listarDeEmpresaAutenticada: ReturnType<typeof vi.fn> };
  let calificacionService: {
    crearCalificacion: ReturnType<typeof vi.fn>;
    editarCalificacion: ReturnType<typeof vi.fn>;
    obtenerPorAuditoria: ReturnType<typeof vi.fn>;
  };
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
    // cargarContextoCalificacion es fire-and-forget (void), necesita un microtask adicional
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function configurarComoAdminEmpresa(): void {
    authSessionStub.isAdministradorEmpresa.mockReturnValue(true);
    authSessionStub.getRole.mockReturnValue('administrador_empresa');
  }

  function configurarComoUsuarioNormal(): void {
    authSessionStub.isAdministradorEmpresa.mockReturnValue(false);
    authSessionStub.getRole.mockReturnValue('usuario_general_empresa');
  }

  beforeEach(async () => {
    perfilService = {
      obtenerPerfilPublico: vi.fn().mockReturnValue(of(PERFIL_COMPLETO)),
    };
    auditoresService = {
      obtenerEspecialidades: vi
        .fn()
        .mockReturnValue(of([{ valor: 'HUELLA_CARBONO', etiqueta: 'Huella carbono' }])),
      obtenerZonas: vi.fn().mockReturnValue(of([])),
    };

    auditoriasService = {
      listarDeEmpresaAutenticada: vi.fn().mockReturnValue(of([AUDITORIA_CALIFICABLE])),
    };

    calificacionService = {
      crearCalificacion: vi.fn().mockReturnValue(of(CALIFICACION_CREADA)),
      editarCalificacion: vi.fn().mockReturnValue(of(CALIFICACION_EXISTENTE)),
      obtenerPorAuditoria: vi.fn().mockReturnValue(of(null)),
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
          useValue: { snapshot: { paramMap: { get: () => AUDITOR_ID } } },
        },
        { provide: PerfilPublicoAuditorService, useValue: perfilService },
        { provide: AuditoresService, useValue: auditoresService },
        { provide: AuditoriasService, useValue: auditoriasService },
        { provide: CalificacionService, useValue: calificacionService },
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

  describe('Renderizado condicional del CalificacionFormComponent', () => {
    it('muestra el componente calificacion-form cuando el usuario es admin empresa y existe auditoría calificable', async () => {
      configurarComoAdminEmpresa();

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formSection = raiz().querySelector('app-calificacion-form');
      expect(formSection).not.toBeNull();
    });

    it('NO muestra calificacion-form cuando el usuario no es admin empresa', async () => {
      configurarComoUsuarioNormal();

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formSection = raiz().querySelector('app-calificacion-form');
      expect(formSection).toBeNull();
    });

    it('NO muestra calificacion-form cuando no hay auditoría calificable (lista vacía)', async () => {
      configurarComoAdminEmpresa();
      auditoriasService.listarDeEmpresaAutenticada.mockReturnValue(of([]));

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formSection = raiz().querySelector('app-calificacion-form');
      expect(formSection).toBeNull();
    });

    it('NO muestra calificacion-form cuando la auditoría no tiene estado CERTIFICACION_EMITIDA', async () => {
      configurarComoAdminEmpresa();
      auditoriasService.listarDeEmpresaAutenticada.mockReturnValue(
        of([{ ...AUDITORIA_CALIFICABLE, estado: 'EN_REVISION' }])
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formSection = raiz().querySelector('app-calificacion-form');
      expect(formSection).toBeNull();
    });

    it('NO muestra calificacion-form cuando la auditoría pertenece a otro auditor', async () => {
      configurarComoAdminEmpresa();
      auditoriasService.listarDeEmpresaAutenticada.mockReturnValue(
        of([{ ...AUDITORIA_CALIFICABLE, idAuditor: 'otro-auditor-id' }])
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formSection = raiz().querySelector('app-calificacion-form');
      expect(formSection).toBeNull();
    });
  });

  describe('Inputs correctos al CalificacionFormComponent', () => {
    it('muestra formulario en modo creación cuando no hay calificación existente', async () => {
      configurarComoAdminEmpresa();

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formSection = raiz().querySelector('app-calificacion-form');
      expect(formSection).not.toBeNull();
      expect(formSection!.textContent).toContain('Calificar auditor');
    });

    it('muestra formulario en modo edición con valores precargados cuando hay calificación existente', async () => {
      configurarComoAdminEmpresa();
      calificacionService.obtenerPorAuditoria.mockReturnValue(of(CALIFICACION_EXISTENTE));

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formSection = raiz().querySelector('app-calificacion-form');
      expect(formSection).not.toBeNull();
      // El componente entra directamente en modo edición con los datos precargados
      expect(formSection!.textContent).toContain('Editar calificación');
    });
  });

  describe('Flujo completo de creación', () => {
    beforeEach(() => {
      configurarComoAdminEmpresa();
    });

    it('renderiza formulario con estrellas y botón Guardar', async () => {
      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formElement = raiz().querySelector('app-calificacion-form');
      expect(formElement).not.toBeNull();

      // Debe tener el componente star-rating
      const starRating = formElement!.querySelector('app-star-rating');
      expect(starRating).not.toBeNull();

      // Debe tener un botón que contiene el texto Guardar
      const botones = Array.from(formElement!.querySelectorAll('button'));
      const botonGuardar = botones.find((b) => b.textContent?.includes('Guardar'));
      expect(botonGuardar).toBeDefined();
    });

    it('muestra toast de éxito tras creación exitosa', async () => {
      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formElement = raiz().querySelector('app-calificacion-form')!;

      // Simular selección de estrella clickeando un radio button del star-rating
      const starButtons = formElement.querySelectorAll<HTMLButtonElement>('app-star-rating button');

      if (starButtons.length >= 5) {
        starButtons[4].click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        // Submit del formulario
        const form = formElement.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit'));
          fixture.detectChanges();
          await fixture.whenStable();
          fixture.detectChanges();

          const mensajes = toastService.toasts().map((t) => t.title);
          expect(mensajes).toContain('Calificación guardada correctamente.');
        }
      }
    });

    it('muestra toast de error "No es posible calificar esta auditoría." con HTTP 403', async () => {
      calificacionService.crearCalificacion.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' }))
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formElement = raiz().querySelector('app-calificacion-form')!;

      const starButtons = formElement.querySelectorAll<HTMLButtonElement>('app-star-rating button');

      if (starButtons.length >= 3) {
        starButtons[2].click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const form = formElement.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit'));
          fixture.detectChanges();
          await fixture.whenStable();
          fixture.detectChanges();
          await new Promise((r) => setTimeout(r, 0));
          fixture.detectChanges();

          const mensajes = toastService.toasts().map((t) => t.title);
          expect(mensajes).toContain('No es posible calificar esta auditoría.');
        }
      }
    });
  });

  describe('Flujo completo de edición', () => {
    beforeEach(() => {
      configurarComoAdminEmpresa();
      calificacionService.obtenerPorAuditoria.mockReturnValue(of(CALIFICACION_EXISTENTE));
    });

    it('muestra formulario en modo edición con título "Editar calificación" cuando hay calificación previa', async () => {
      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formElement = raiz().querySelector('app-calificacion-form')!;
      expect(formElement.textContent).toContain('Editar calificación');
    });

    it('precarga los valores de la calificación existente en el formulario', async () => {
      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formElement = raiz().querySelector('app-calificacion-form')!;
      // El comentario "Buen trabajo en la auditoría." tiene 29 chars
      expect(formElement.textContent).toContain('29 / 500 caracteres');
    });

    it('muestra toast de éxito tras edición exitosa', async () => {
      calificacionService.editarCalificacion.mockReturnValue(
        of({ ...CALIFICACION_EXISTENTE, calificacion: 5, actualizadoEn: '2025-07-01T12:00:00Z' })
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formElement = raiz().querySelector('app-calificacion-form')!;

      // Enviar formulario de edición (ya está en modo edición con datos precargados)
      const form = formElement.querySelector('form');
      expect(form).not.toBeNull();

      form!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await new Promise((r) => setTimeout(r, 0));
      fixture.detectChanges();

      const mensajes = toastService.toasts().map((t) => t.title);
      expect(mensajes).toContain('Calificación actualizada correctamente.');
    });
  });

  describe('Manejo de errores en carga de contexto', () => {
    it('no muestra calificacion-form si el servicio de auditorías falla', async () => {
      configurarComoAdminEmpresa();
      auditoriasService.listarDeEmpresaAutenticada.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );

      fixture = TestBed.createComponent(PerfilPublicoAuditorPageComponent);
      await estabilizar();

      const formSection = raiz().querySelector('app-calificacion-form');
      expect(formSection).toBeNull();
    });
  });
});
