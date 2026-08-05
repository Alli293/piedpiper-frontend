import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DetalleSolicitudAuditoria, INTERVALO_SONDEO_DETALLE_MS } from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';
import { DetalleAuditoriaPageComponent } from './detalle-auditoria-page.component';

describe('DetalleAuditoriaPageComponent', () => {
  let fixture: ComponentFixture<DetalleAuditoriaPageComponent>;
  let auditoriasService: { obtenerDetalle: ReturnType<typeof vi.fn> };
  let oculto: boolean;

  const enRevision: DetalleSolicitudAuditoria = {
    id: 'sol-1',
    tipoCertificacion: 'INICIAL',
    periodoInicio: '2025-01-01',
    periodoFin: '2025-12-31',
    descripcionSolicitud: null,
    estado: 'EN_REVISION',
    estadoDescripcion: 'En revisión',
    fechaCreacion: '2026-06-02T14:32:00Z',
    documentos: [{ id: 'doc-1', nombreArchivo: 'inventario-2025.pdf', tamanioBytes: 2_516_582 }],
    auditor: { id: 'aud-1', nombre: 'Guillermo Murillo Salas' },
    origenAsignacion: 'MANUAL',
    fechaAsignacion: '2026-06-10T09:15:00Z',
    nombreEmpresa: 'Café del Valle S.A.',
    historial: [
      {
        estadoAnterior: 'SOLICITUD_ENVIADA',
        estadoNuevo: 'SOLICITUD_ENVIADA',
        evento: 'SOLICITUD_CREADA',
        actor: 'EMPRESA',
        responsable: 'Marta Gerente',
        fecha: '2026-06-02T14:32:00Z',
      },
      {
        estadoAnterior: 'SOLICITUD_ENVIADA',
        estadoNuevo: 'AUDITOR_ASIGNADO',
        evento: 'AUDITOR_ACEPTA',
        actor: 'AUDITOR',
        responsable: 'Guillermo Murillo Salas',
        fecha: '2026-06-10T09:15:00Z',
      },
      {
        estadoAnterior: 'AUDITOR_ASIGNADO',
        estadoNuevo: 'EN_REVISION',
        evento: 'INICIO_REVISION',
        actor: 'AUDITOR',
        responsable: 'Guillermo Murillo Salas',
        fecha: '2026-06-12T09:16:00Z',
      },
    ],
  };

  const certificada: DetalleSolicitudAuditoria = {
    ...enRevision,
    estado: 'CERTIFICACION_EMITIDA',
    estadoDescripcion: 'Certificación emitida',
  };

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function pasos(): HTMLElement[] {
    return Array.from(raiz().querySelectorAll<HTMLElement>('.ch-detalle-auditoria__paso'));
  }

  function situaciones(): string[] {
    return pasos().map((paso) => {
      if (paso.classList.contains('ch-detalle-auditoria__paso--completado')) return 'completado';
      if (paso.classList.contains('ch-detalle-auditoria__paso--en-curso')) return 'en-curso';
      return 'pendiente';
    });
  }

  function aviso(): string | null {
    return raiz().querySelector('.ch-detalle-auditoria__aviso')?.textContent?.trim() ?? null;
  }

  async function estabilizar(): Promise<void> {
    for (let intento = 0; intento < 5; intento += 1) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  }

  async function montar(): Promise<void> {
    fixture = TestBed.createComponent(DetalleAuditoriaPageComponent);
    fixture.componentRef.setInput('id', 'sol-1');
    await estabilizar();
  }

  /** Dispara el evento del navegador que el componente escucha para pausar y reanudar el sondeo. */
  async function cambiarVisibilidad(ocultar: boolean): Promise<void> {
    oculto = ocultar;
    document.dispatchEvent(new Event('visibilitychange'));
    await estabilizar();
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    oculto = false;
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => oculto);

    auditoriasService = { obtenerDetalle: vi.fn().mockReturnValue(of(enRevision)) };

    await TestBed.configureTestingModule({
      imports: [DetalleAuditoriaPageComponent],
      providers: [
        provideRouter([]),
        ToastService,
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

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('dibuja el recorrido completo marcando el estado actual como en curso', async () => {
    await montar();

    expect(pasos()).toHaveLength(5);
    expect(situaciones()).toEqual([
      'completado',
      'completado',
      'en-curso',
      'pendiente',
      'pendiente',
    ]);
  });

  it('muestra el responsable que devolvio el servidor en cada paso registrado', async () => {
    await montar();

    const notas = Array.from(raiz().querySelectorAll('.ch-detalle-auditoria__paso-nota')).map(
      (nodo) => nodo.textContent?.trim()
    );
    expect(notas[0]).toContain('Marta Gerente');
    expect(notas[1]).toContain('Guillermo Murillo Salas');
  });

  it('sondea de nuevo al cumplirse el intervalo y actualiza la linea de tiempo', async () => {
    await montar();
    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(1);

    auditoriasService.obtenerDetalle.mockReturnValue(of(certificada));
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS);
    await estabilizar();

    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(2);
    expect(situaciones().at(-1)).toBe('en-curso');
  });

  it('detiene el sondeo cuando la pestana pierde el foco y lo reanuda al recuperarlo', async () => {
    await montar();

    await cambiarVisibilidad(true);
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS * 3);
    await estabilizar();
    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(1);

    await cambiarVisibilidad(false);
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS);
    await estabilizar();
    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(2);
  });

  it('ante un fallo del sondeo conserva el ultimo estado y muestra el aviso', async () => {
    await montar();

    auditoriasService.obtenerDetalle.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 }))
    );
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS);
    await estabilizar();

    expect(aviso()).toContain('No se pudo actualizar en tiempo real');
    expect(pasos()).toHaveLength(5);
    expect(situaciones()[2]).toBe('en-curso');
  });

  /**
   * El error termina un observable de RxJS: sin el catchError adentro del switchMap, el fallo de
   * un ciclo mataria el sondeo para siempre y la pantalla quedaria congelada sin avisar.
   */
  it('sigue sondeando despues de un fallo y limpia el aviso al recuperarse', async () => {
    await montar();

    auditoriasService.obtenerDetalle.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS);
    await estabilizar();
    expect(aviso()).not.toBeNull();

    auditoriasService.obtenerDetalle.mockReturnValue(of(certificada));
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS);
    await estabilizar();

    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(3);
    expect(aviso()).toBeNull();
  });

  /**
   * 403 y 404 no cambian por reintentar. Sin cortar el sondeo, la pantalla golpea el servidor cada
   * 15 segundos indefinidamente y el aviso de error nunca se limpia, asi que tampoco se recupera.
   */
  it('deja de sondear cuando la carga inicial devuelve un error permanente', async () => {
    auditoriasService.obtenerDetalle.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 }))
    );
    await montar();

    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS * 4);
    await estabilizar();

    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(1);
  });

  /** Al rechazar, el auditor deja de estar asignado y la solicitud pasa a devolverle 403. */
  it('deja de sondear si pierde el acceso a mitad del sondeo', async () => {
    await montar();

    auditoriasService.obtenerDetalle.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 }))
    );
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS);
    await estabilizar();

    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS * 4);
    await estabilizar();

    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(2);
  });

  it('una solicitud ajena muestra el mensaje de permiso y no la linea de tiempo', async () => {
    auditoriasService.obtenerDetalle.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 }))
    );

    await montar();

    expect(raiz().querySelector('.ch-detalle-auditoria__error')?.textContent).toContain(
      'No tienes permiso'
    );
    expect(pasos()).toHaveLength(0);
  });

  it('una solicitud inexistente muestra el mensaje de no encontrada', async () => {
    auditoriasService.obtenerDetalle.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    await montar();

    expect(raiz().querySelector('.ch-detalle-auditoria__error')?.textContent).toContain(
      'no fue encontrada'
    );
  });

  it('con observaciones pendientes el ultimo paso sustituye a la certificacion', async () => {
    auditoriasService.obtenerDetalle.mockReturnValue(
      of({
        ...enRevision,
        estado: 'OBSERVACIONES_PENDIENTES',
        estadoDescripcion: 'Observaciones pendientes',
      } as DetalleSolicitudAuditoria)
    );

    await montar();

    const titulos = pasos().map((paso) =>
      paso.querySelector('.ch-detalle-auditoria__paso-titulo')?.textContent?.trim()
    );
    expect(titulos.at(-1)).toBe('Observaciones pendientes');
    expect(titulos).not.toContain('Certificación emitida');
  });

  /**
   * Con el sondeo arrancando en paralelo a la carga inicial, una inicial mas lenta que un ciclo
   * llegaba despues y pisaba el detalle con datos mas viejos que los que ya estaban en pantalla.
   */
  it('la carga inicial lenta no pisa lo que ya trajo el sondeo', async () => {
    let responderInicial: (detalle: DetalleSolicitudAuditoria) => void = () => undefined;
    auditoriasService.obtenerDetalle.mockReturnValueOnce(
      new Observable<DetalleSolicitudAuditoria>((observador) => {
        responderInicial = (detalle) => {
          observador.next(detalle);
          observador.complete();
        };
      })
    );
    auditoriasService.obtenerDetalle.mockReturnValue(of(certificada));

    await montar();

    // Mientras la inicial sigue en vuelo, el sondeo todavia no arranco.
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS * 2);
    await estabilizar();
    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(1);

    responderInicial(enRevision);
    await estabilizar();

    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS);
    await estabilizar();

    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(2);
    expect(situaciones().at(-1)).toBe('en-curso');
  });

  it('muestra un guion cuando el tamano del documento no es un numero utilizable', async () => {
    auditoriasService.obtenerDetalle.mockReturnValue(
      of({
        ...enRevision,
        documentos: [
          { id: 'doc-1', nombreArchivo: 'inventario.pdf', tamanioBytes: null as unknown as number },
        ],
      })
    );

    await montar();

    expect(raiz().querySelector('.ch-detalle-auditoria__documento-peso')?.textContent?.trim()).toBe(
      '—'
    );
  });

  it('deja de sondear al destruir el componente', async () => {
    await montar();

    fixture.destroy();
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS * 2);

    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(1);
  });
});
