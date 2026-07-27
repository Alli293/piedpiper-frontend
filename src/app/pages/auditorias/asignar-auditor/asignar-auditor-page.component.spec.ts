import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuditorResumen, PaginaAuditores } from '../../auditores/auditor.model';
import { AuditoresService } from '../../auditores/auditores.service';
import { SolicitudAuditoriaAsignada } from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';
import { AsignarAuditorPageComponent } from './asignar-auditor-page.component';

describe('AsignarAuditorPageComponent', () => {
  let fixture: ComponentFixture<AsignarAuditorPageComponent>;
  let toastService: ToastService;
  let auditoresService: {
    listar: ReturnType<typeof vi.fn>;
    obtenerEspecialidades: ReturnType<typeof vi.fn>;
  };
  let auditoriasService: {
    asignarAuditor: ReturnType<typeof vi.fn>;
    obtenerSolicitud: ReturnType<typeof vi.fn>;
  };

  const ana: AuditorResumen = {
    auditorId: 'aud-1',
    nombre: 'Ana Mora',
    fotoPerfil: null,
    especialidadesPrincipales: ['AGROINDUSTRIA'],
    calificacionPromedio: 4.5,
    totalResenas: 30,
    disponible: true,
    auditoriasCompletadas: 42,
    aniosExperiencia: 8,
    provincia: 'SAN_JOSE',
  };

  const luis: AuditorResumen = {
    ...ana,
    auditorId: 'aud-2',
    nombre: 'Luis Vega',
    especialidadesPrincipales: ['ENERGIA_RENOVABLE'],
    calificacionPromedio: null,
    totalResenas: 0,
  };

  const pagina: PaginaAuditores = {
    contenido: [ana, luis],
    totalResultados: 2,
    paginaActual: 0,
    totalPaginas: 1,
  };

  const solicitudAsignada: SolicitudAuditoriaAsignada = {
    id: 'sol-1',
    tipoCertificacion: 'INICIAL',
    periodoInicio: '2024-01-01',
    periodoFin: '2024-06-30',
    descripcionSolicitud: null,
    estado: 'PENDIENTE_ASIGNACION',
    fechaCreacion: '2024-07-01T10:00:00Z',
    documentos: [],
    auditor: { id: 'aud-1', nombre: 'Ana Mora' },
    origenAsignacion: 'manual',
    fechaAsignacion: '2024-07-02T09:00:00Z',
  };

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function botonesSeleccionar(): HTMLButtonElement[] {
    return Array.from(raiz().querySelectorAll<HTMLButtonElement>('.ch-auditor-opcion__accion'));
  }

  function botonAsignar(): HTMLButtonElement | null {
    return raiz().querySelector<HTMLButtonElement>('.ch-asignar__acciones button');
  }

  function ultimoToast() {
    const toasts = toastService.toasts();
    return toasts[toasts.length - 1];
  }

  /** Las cargas encadenan varias promesas: se drenan las microtareas antes de leer el DOM. */
  async function estabilizar(): Promise<void> {
    for (let intento = 0; intento < 5; intento += 1) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  }

  async function montar(): Promise<void> {
    fixture = TestBed.createComponent(AsignarAuditorPageComponent);
    fixture.componentRef.setInput('id', 'sol-1');
    toastService = TestBed.inject(ToastService);
    await estabilizar();
  }

  beforeEach(async () => {
    auditoresService = {
      listar: vi.fn().mockReturnValue(of(pagina)),
      obtenerEspecialidades: vi
        .fn()
        .mockReturnValue(of([{ valor: 'AGROINDUSTRIA', etiqueta: 'Agroindustria' }])),
    };
    auditoriasService = {
      asignarAuditor: vi.fn().mockReturnValue(of(solicitudAsignada)),
      obtenerSolicitud: vi.fn().mockReturnValue(of({ ...solicitudAsignada, auditor: null })),
    };

    await TestBed.configureTestingModule({
      imports: [AsignarAuditorPageComponent],
      providers: [
        provideRouter([]),
        ToastService,
        { provide: AuditoresService, useValue: auditoresService },
        { provide: AuditoriasService, useValue: auditoriasService },
        {
          provide: AuthSessionService,
          useValue: {
            isAdministradorEmpresa: () => true,
            getRole: vi.fn().mockReturnValue('administrador_empresa'),
            getUserName: vi.fn().mockReturnValue('Admin'),
          },
        },
        { provide: AuthService, useValue: { token: signal('fake-token'), cerrarSesion: vi.fn() } },
        { provide: SesionInactividadService, useValue: { reiniciar: vi.fn(), detener: vi.fn() } },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();
  });

  it('muestra una tarjeta por cada auditor devuelto por el servicio', async () => {
    await montar();

    const nombres = Array.from(raiz().querySelectorAll('.ch-auditor-opcion__nombre')).map((nodo) =>
      nodo.textContent?.trim()
    );
    expect(nombres).toEqual(['Ana Mora', 'Luis Vega']);
    expect(auditoresService.listar).toHaveBeenCalledTimes(1);
    expect(auditoresService.listar.mock.calls[0][0]).toMatchObject({ soloDisponibles: true });
    expect(botonesSeleccionar().length).toBe(2);
  });

  it('muestra el estado vacio cuando no hay auditores activos', async () => {
    auditoresService.listar.mockReturnValue(
      of({ contenido: [], totalResultados: 0, paginaActual: 0, totalPaginas: 0 })
    );

    await montar();

    expect(raiz().querySelector('.ch-asignar__estado')?.textContent).toContain(
      'No hay auditores certificados disponibles'
    );
    expect(botonAsignar()).toBeNull();
  });

  it('permite reintentar cuando falla la carga del directorio', async () => {
    auditoresService.listar.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    await montar();

    const error = raiz().querySelector('.ch-asignar__estado--error');
    expect(error?.getAttribute('role')).toBe('alert');

    error?.querySelector('button')?.click();
    await estabilizar();

    expect(botonesSeleccionar().length).toBe(2);
  });

  it('deshabilita el boton de asignar mientras no haya un auditor seleccionado', async () => {
    await montar();

    expect(botonAsignar()?.disabled).toBe(true);

    botonesSeleccionar()[0].click();
    await estabilizar();

    expect(botonAsignar()?.disabled).toBe(false);
  });

  it('deshabilita los botones mientras se envia la asignacion', async () => {
    const pendiente = new Subject<SolicitudAuditoriaAsignada>();
    auditoriasService.asignarAuditor.mockReturnValue(pendiente.asObservable());
    await montar();

    botonesSeleccionar()[0].click();
    await estabilizar();
    botonAsignar()?.click();
    await estabilizar();

    expect(botonAsignar()?.disabled).toBe(true);
    expect(botonesSeleccionar().every((boton) => boton.disabled)).toBe(true);

    pendiente.next(solicitudAsignada);
    pendiente.complete();
    await estabilizar();

    expect(auditoriasService.asignarAuditor).toHaveBeenCalledTimes(1);
  });

  it('asigna el auditor seleccionado con origen manual y oculta los botones de seleccion', async () => {
    await montar();

    botonesSeleccionar()[0].click();
    await estabilizar();
    botonAsignar()?.click();
    await estabilizar();

    expect(auditoriasService.asignarAuditor).toHaveBeenCalledWith('sol-1', {
      idAuditor: 'aud-1',
      origenAsignacion: 'manual',
    });
    expect(ultimoToast().variant).toBe('success');
    expect(ultimoToast().title).toBe(
      'Solicitud enviada a Ana Mora. Te notificaremos cuando responda.'
    );
    expect(botonesSeleccionar().length).toBe(0);
    expect(botonAsignar()).toBeNull();

    const pendienteUi = raiz().querySelector('.ch-asignar__pendiente');
    expect(pendienteUi?.getAttribute('role')).toBe('status');
    expect(pendienteUi?.textContent).toContain('Ana Mora');
  });

  it('muestra el mensaje del backend ante un 409 y permite reintentar con otro auditor', async () => {
    auditoriasService.asignarAuditor.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Ya existe una solicitud de revisión pendiente con otro auditor.' },
          })
      )
    );
    await montar();

    botonesSeleccionar()[0].click();
    await estabilizar();
    botonAsignar()?.click();
    await estabilizar();

    const alerta = raiz().querySelector('.ch-asignar__error');
    expect(alerta?.getAttribute('role')).toBe('alert');
    expect(alerta?.textContent?.trim()).toBe(
      'Ya existe una solicitud de revisión pendiente con otro auditor.'
    );
    expect(ultimoToast().variant).toBe('error');
    expect(botonesSeleccionar().length).toBe(2);

    botonesSeleccionar()[1].click();
    await estabilizar();
    botonAsignar()?.click();
    await estabilizar();

    expect(auditoriasService.asignarAuditor).toHaveBeenLastCalledWith('sol-1', {
      idAuditor: 'aud-2',
      origenAsignacion: 'manual',
    });
    expect(botonesSeleccionar().length).toBe(0);
  });
  it('si la solicitud ya tiene un auditor asignado rehidrata el estado y no ofrece seleccionar', async () => {
    auditoriasService.obtenerSolicitud.mockReturnValue(of(solicitudAsignada));

    await montar();

    expect(auditoriasService.obtenerSolicitud).toHaveBeenCalledWith('sol-1');
    expect(botonesSeleccionar().length).toBe(0);
    expect(raiz().textContent).toContain('Ana Mora');
  });

  it('si no se puede consultar la solicitud la pantalla sigue permitiendo asignar', async () => {
    auditoriasService.obtenerSolicitud.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    await montar();

    expect(botonesSeleccionar().length).toBe(2);
  });
});
