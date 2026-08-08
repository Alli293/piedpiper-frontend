import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { seleccionarFechaDeInput } from '../../../shared/components/inputs/date-input/date-input.testing';
import { ToastService } from '../../../shared/services/toast.service';
import { DetalleSolicitudAuditoria, INTERVALO_SONDEO_DETALLE_MS } from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';
import { DetalleAuditoriaPageComponent } from './detalle-auditoria-page.component';

describe('DetalleAuditoriaPageComponent', () => {
  let fixture: ComponentFixture<DetalleAuditoriaPageComponent>;
  let auditoriasService: {
    obtenerDetalle: ReturnType<typeof vi.fn>;
    responderDecision: ReturnType<typeof vi.fn>;
    emitirResultado: ReturnType<typeof vi.fn>;
    cargarReporte: ReturnType<typeof vi.fn>;
    descargarDocumento: ReturnType<typeof vi.fn>;
  };
  let oculto: boolean;
  let idSesion: string | null;
  let rolSesion: string;

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
    fechaAceptacion: null,
    motivoRechazo: null,
    fechaRechazo: null,
    reporteAuditoria: null,
    fechaAuditoriaRealizada: null,
    fechaCargaReporte: null,
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

  /** Con lo minimo que el helper realmente usa: si le falta algo, el test tiene que enterarse. */
  function ventanaFalsa(): Window {
    return {
      location: { href: '' },
      close: vi.fn(),
      addEventListener: vi.fn(),
    } as unknown as Window;
  }

  function botonVolver(): HTMLButtonElement | null {
    return raiz().querySelector<HTMLButtonElement>('button[aria-label="Volver"]');
  }

  function botonVerPdf(): HTMLButtonElement | null {
    return raiz().querySelector<HTMLButtonElement>(
      '.ch-detalle-auditoria__documento app-button button'
    );
  }

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

  function panelDecision(): HTMLElement | null {
    return raiz().querySelector('.ch-detalle-auditoria__decision');
  }

  function plazo(): string | null {
    return raiz().querySelector('.ch-detalle-auditoria__plazo')?.textContent?.trim() ?? null;
  }

  function botonesDecision(): HTMLButtonElement[] {
    return Array.from(
      raiz().querySelectorAll<HTMLButtonElement>('.ch-detalle-auditoria__decision-botones button')
    );
  }

  function botonPorTexto(texto: string): HTMLButtonElement | undefined {
    return botonesDecision().find((boton) => boton.textContent?.trim() === texto);
  }

  function botonCargaReporte(): HTMLButtonElement | null {
    return raiz().querySelector<HTMLButtonElement>(
      '.ch-detalle-auditoria__reporte-form app-button button'
    );
  }

  function inputReporte(): HTMLInputElement | null {
    return raiz().querySelector<HTMLInputElement>(
      '.ch-detalle-auditoria__reporte input[type="file"]'
    );
  }

  async function seleccionarReporte(archivo: File): Promise<void> {
    const input = inputReporte();
    if (!input) throw new Error('No se encontró el input de reporte');
    Object.defineProperty(input, 'files', { value: [archivo], configurable: true });
    input.dispatchEvent(new Event('change'));
    await Promise.resolve();
    await Promise.resolve();
    await estabilizar();
  }

  /** Deja la solicitud asignada al auditor de la sesión, con la asignación hecha hace `horas`. */
  function asignadaAlAuditor(horas: number): DetalleSolicitudAuditoria {
    return {
      ...enRevision,
      estado: 'SOLICITUD_ENVIADA',
      estadoDescripcion: 'Solicitud enviada',
      fechaAsignacion: new Date(Date.now() - horas * 60 * 60 * 1000).toISOString(),
      fechaAceptacion: null,
    };
  }

  async function montarComoAuditorAsignado(horas = 2): Promise<void> {
    idSesion = 'aud-1';
    rolSesion = 'auditor_certificado';
    auditoriasService.obtenerDetalle.mockReturnValue(of(asignadaAlAuditor(horas)));
    await montar();
  }

  async function montarCargaReporte(
    estado: DetalleSolicitudAuditoria['estado'] = 'EN_REVISION'
  ): Promise<void> {
    idSesion = 'aud-1';
    rolSesion = 'auditor_certificado';
    auditoriasService.obtenerDetalle.mockReturnValue(
      of({
        ...enRevision,
        estado,
        estadoDescripcion:
          estado === 'REPORTE_CARGADO' ? 'Reporte cargado' : enRevision.estadoDescripcion,
        fechaAceptacion: '2026-07-20T10:00:00Z',
        reporteAuditoria:
          estado === 'REPORTE_CARGADO'
            ? { id: 'rep-1', nombreArchivo: 'reporte.pdf', tamanioBytes: 20 }
            : null,
        fechaAuditoriaRealizada: estado === 'REPORTE_CARGADO' ? '2026-07-28' : null,
        fechaCargaReporte: estado === 'REPORTE_CARGADO' ? '2026-07-28T18:00:00Z' : null,
      })
    );
    await montar();
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

  function reportePdf(nombre = 'reporte.pdf'): File {
    return new File(['%PDF-1.7 contenido'], nombre, { type: 'application/pdf' });
  }

  function reportePesado(): File {
    return new File(['%PDF-', new Uint8Array(25 * 1024 * 1024 + 1)], 'pesado.pdf', {
      type: 'application/pdf',
    });
  }

  function errorApi(mensaje: string, status = 422): HttpErrorResponse {
    return new HttpErrorResponse({ status, error: { message: mensaje } });
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    oculto = false;
    idSesion = 'admin-1';
    rolSesion = 'administrador_empresa';
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => oculto);

    auditoriasService = {
      obtenerDetalle: vi.fn().mockReturnValue(of(enRevision)),
      responderDecision: vi.fn().mockReturnValue(of(undefined)),
      emitirResultado: vi.fn().mockReturnValue(
        of({
          ...enRevision,
          estado: 'CERTIFICACION_EMITIDA',
          estadoDescripcion: 'Certificación emitida',
          reporteAuditoria: { id: 'rep-1', nombreArchivo: 'reporte.pdf', tamanioBytes: 20 },
          fechaAuditoriaRealizada: '2026-07-28',
          fechaCargaReporte: '2026-07-28T18:00:00Z',
        } as DetalleSolicitudAuditoria)
      ),
      cargarReporte: vi.fn().mockReturnValue(
        of({
          ...enRevision,
          estado: 'REPORTE_CARGADO',
          estadoDescripcion: 'Reporte cargado',
          reporteAuditoria: { id: 'rep-1', nombreArchivo: 'reporte.pdf', tamanioBytes: 20 },
          fechaAuditoriaRealizada: '2026-07-28',
          fechaCargaReporte: '2026-07-28T18:00:00Z',
        } as DetalleSolicitudAuditoria)
      ),
      descargarDocumento: vi
        .fn()
        .mockReturnValue(of(new Blob(['%PDF-1.4'], { type: 'application/pdf' }))),
    };

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
            getRole: vi.fn(() => rolSesion),
            getUserName: vi.fn().mockReturnValue('Admin'),
            getUserId: vi.fn(() => idSesion),
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

  it('detiene el sondeo cuando la pestaña pierde el foco y lo reanuda al recuperarlo', async () => {
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

  it('no ofrece las acciones a la empresa, que no es quien responde', async () => {
    await montar();

    expect(panelDecision()).toBeNull();
  });

  it('el auditor asignado ve el panel para aceptar o rechazar', async () => {
    await montarComoAuditorAsignado();

    expect(panelDecision()).not.toBeNull();
    expect(botonPorTexto('Aceptar')).toBeDefined();
    expect(botonPorTexto('Rechazar')).toBeDefined();
  });

  it('con mas de un dia por delante el plazo se muestra en dias completos', async () => {
    await montarComoAuditorAsignado(50);

    expect(plazo()).toBe('Quedan 2 días');
  });

  it('en el ultimo dia el plazo se muestra en horas completas', async () => {
    await montarComoAuditorAsignado(100);

    expect(plazo()).toBe('Quedan 20 horas');
  });

  it('pasado el plazo lo dice en vez de mostrar un contador en cero', async () => {
    await montarComoAuditorAsignado(130);

    expect(plazo()).toBe('El plazo para responder venció');
  });

  it('aceptar envia la decision al servicio', async () => {
    await montarComoAuditorAsignado();

    botonPorTexto('Aceptar')?.click();
    await estabilizar();

    expect(auditoriasService.responderDecision).toHaveBeenCalledWith('sol-1', {
      decision: 'aceptada',
    });
  });

  it('el campo de motivo solo aparece al elegir rechazar', async () => {
    await montarComoAuditorAsignado();
    expect(raiz().querySelector('app-textarea')).toBeNull();

    botonPorTexto('Rechazar')?.click();
    await estabilizar();

    expect(raiz().querySelector('app-textarea')).not.toBeNull();
  });

  it('el boton de confirmar queda deshabilitado hasta que el motivo alcanza el minimo', async () => {
    await montarComoAuditorAsignado();
    botonPorTexto('Rechazar')?.click();
    await estabilizar();

    expect(botonPorTexto('Confirmar rechazo')?.disabled).toBe(true);

    const campo = raiz().querySelector('textarea');
    if (campo) {
      campo.value = 'corto';
      campo.dispatchEvent(new Event('input'));
    }
    await estabilizar();
    expect(botonPorTexto('Confirmar rechazo')?.disabled).toBe(true);

    if (campo) {
      campo.value = 'No tengo disponibilidad este trimestre';
      campo.dispatchEvent(new Event('input'));
    }
    await estabilizar();
    expect(botonPorTexto('Confirmar rechazo')?.disabled).toBe(false);
  });

  it('una solicitud ya aceptada deja de ofrecer las acciones', async () => {
    idSesion = 'aud-1';
    rolSesion = 'auditor_certificado';
    auditoriasService.obtenerDetalle.mockReturnValue(
      of({ ...asignadaAlAuditor(2), fechaAceptacion: '2026-06-11T10:00:00Z' })
    );
    await montar();

    expect(panelDecision()).toBeNull();
  });

  it('habilita la carga de reporte para el auditor asignado cuando la solicitud esta en revision', async () => {
    await montarCargaReporte();

    expect(raiz().querySelector('.ch-detalle-auditoria__reporte-form')).not.toBeNull();
    expect(botonCargaReporte()?.disabled).toBe(true);
  });

  it('muestra el texto deshabilitado cuando el estado no permite cargar reporte', async () => {
    await montarCargaReporte('CERTIFICACION_EMITIDA');

    expect(raiz().querySelector('.ch-detalle-auditoria__reporte-form')).toBeNull();
    expect(raiz().textContent).toContain(
      'La carga del reporte estará disponible una vez que la auditoría esté en revisión.'
    );
  });

  it('valida el tipo de archivo al seleccionar el reporte', async () => {
    await montarCargaReporte();

    await seleccionarReporte(new File(['texto'], 'reporte.txt', { type: 'text/plain' }));

    expect(raiz().querySelector('.ch-file-drop__error')?.textContent).toContain(
      'Solo se aceptan archivos en formato PDF.'
    );
    expect(botonCargaReporte()?.disabled).toBe(true);
  });

  it('muestra error inline cuando el reporte supera veinticinco megas', async () => {
    await montarCargaReporte();

    await seleccionarReporte(reportePesado());

    expect(raiz().querySelector('.ch-file-drop__error')?.textContent).toContain(
      'El archivo no puede superar 25 MB.'
    );
  });

  it('envia el archivo y la fecha al cargar reporte', async () => {
    await montarCargaReporte();
    const archivo = reportePdf();

    await seleccionarReporte(archivo);
    seleccionarFechaDeInput(
      fixture,
      new Date(Date.UTC(2026, 6, 28)),
      '.ch-detalle-auditoria__reporte-form'
    );
    await estabilizar();

    botonCargaReporte()?.click();
    await estabilizar();

    expect(auditoriasService.cargarReporte).toHaveBeenCalledWith('sol-1', archivo, '2026-07-28');
    expect(raiz().textContent).toContain('reporte.pdf');
  });

  it('acepta la fecha local de aceptacion aunque el instante UTC sea del dia siguiente', async () => {
    idSesion = 'aud-1';
    rolSesion = 'auditor_certificado';
    auditoriasService.obtenerDetalle.mockReturnValue(
      of({
        ...enRevision,
        fechaAceptacion: '2026-08-06T04:04:00Z',
      })
    );
    const archivo = reportePdf();

    await montar();
    await seleccionarReporte(archivo);
    seleccionarFechaDeInput(
      fixture,
      new Date(Date.UTC(2026, 7, 5)),
      '.ch-detalle-auditoria__reporte-form'
    );
    await estabilizar();

    expect(
      raiz().querySelector(
        '.ch-detalle-auditoria__reporte-form app-date-input .ch-text-input__error'
      )
    ).toBeNull();
    expect(botonCargaReporte()?.disabled).toBe(false);
  });

  it('muestra el error de fecha devuelto por el servidor en el campo de fecha', async () => {
    auditoriasService.cargarReporte.mockReturnValue(
      throwError(() =>
        errorApi(
          'La fecha de la auditoría debe estar entre la fecha de aceptación y la fecha actual.'
        )
      )
    );
    await montarCargaReporte();

    await seleccionarReporte(reportePdf());
    seleccionarFechaDeInput(
      fixture,
      new Date(Date.UTC(2026, 6, 28)),
      '.ch-detalle-auditoria__reporte-form'
    );
    await estabilizar();
    botonCargaReporte()?.click();
    await estabilizar();

    expect(
      raiz().querySelector(
        '.ch-detalle-auditoria__reporte-form app-date-input .ch-text-input__error'
      )?.textContent
    ).toContain('fecha de la auditor');
  });

  it('muestra el error de archivo devuelto por el servidor en el selector de reporte', async () => {
    auditoriasService.cargarReporte.mockReturnValue(
      throwError(() =>
        errorApi(
          'El archivo no pudo ser procesado. Verifica que no esté dañado y vuelve a intentarlo.'
        )
      )
    );
    await montarCargaReporte();

    await seleccionarReporte(reportePdf());
    seleccionarFechaDeInput(
      fixture,
      new Date(Date.UTC(2026, 6, 28)),
      '.ch-detalle-auditoria__reporte-form'
    );
    await estabilizar();
    botonCargaReporte()?.click();
    await estabilizar();

    expect(raiz().querySelector('.ch-file-drop__error')?.textContent).toContain('archivo');
  });

  it('muestra un error general cuando el servidor no lo asocia a un campo', async () => {
    auditoriasService.cargarReporte.mockReturnValue(
      throwError(() =>
        errorApi('No es posible cargar el reporte en el estado actual de la solicitud.', 409)
      )
    );
    await montarCargaReporte();

    await seleccionarReporte(reportePdf());
    seleccionarFechaDeInput(
      fixture,
      new Date(Date.UTC(2026, 6, 28)),
      '.ch-detalle-auditoria__reporte-form'
    );
    await estabilizar();
    botonCargaReporte()?.click();
    await estabilizar();

    expect(raiz().querySelector('.ch-detalle-auditoria__reporte-alerta')?.textContent).toContain(
      'No es posible cargar'
    );
  });

  it('muestra el panel de resultado cuando el reporte ya esta cargado', async () => {
    await montarCargaReporte('REPORTE_CARGADO');

    expect(raiz().textContent).toContain('Emitir resultado');
    expect(raiz().textContent).toContain('Aprobar auditor');
    expect(raiz().textContent).toContain('Observaciones');
  });

  it('envia el resultado aprobado y actualiza el estado', async () => {
    await montarCargaReporte('REPORTE_CARGADO');

    Array.from(raiz().querySelectorAll<HTMLButtonElement>('button'))
      .find((boton) => boton.textContent?.includes('Aprobar auditor'))
      ?.click();
    await estabilizar();

    expect(auditoriasService.emitirResultado).toHaveBeenCalledWith('sol-1', {
      resultado: 'aprobada',
    });
    expect(raiz().textContent).toContain('Certificación emitida');
  });

  /**
   * El documento se pide por el cliente HTTP y no con un enlace directo: el endpoint exige la
   * cabecera de autenticación, que la navegación del navegador no envía. Con un `<a href>` la
   * previsualización devolvía 401.
   */
  it('previsualizar un documento lo pide al servicio y muestra el blob en la pestaña', async () => {
    const ventana = ventanaFalsa();
    const abrir = vi.spyOn(window, 'open').mockReturnValue(ventana);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await montar();
    botonVerPdf()?.click();
    await estabilizar();

    expect(auditoriasService.descargarDocumento).toHaveBeenCalledWith('sol-1', 'doc-1');
    expect(abrir).toHaveBeenCalledWith('', '_blank');
    expect(ventana.location.href).toBe('blob:fake');
    // Sin esto, un fallo despues de asignar el href pasaria desapercibido: el href ya quedo puesto
    // y la unica senal de que algo se rompio es el toast.
    expect(
      TestBed.inject(ToastService)
        .toasts()
        .some((t) => t.variant === 'error')
    ).toBe(false);
  });

  /**
   * El navegador solo deja abrir una pestaña durante el manejo del clic. Abrirla al volver la
   * petición ya cae fuera de la ventana de activación del usuario y la bloquea como emergente.
   */
  it('abre la pestaña en el clic y no después de que responde el servidor', async () => {
    const ventana = ventanaFalsa();
    const abrir = vi.spyOn(window, 'open').mockReturnValue(ventana);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    let responder: (blob: Blob) => void = () => undefined;
    auditoriasService.descargarDocumento.mockReturnValue(
      new Observable<Blob>((observador) => {
        responder = (blob) => {
          observador.next(blob);
          observador.complete();
        };
      })
    );

    await montar();
    botonVerPdf()?.click();
    await estabilizar();

    expect(abrir).toHaveBeenCalledTimes(1);
    expect(ventana.location.href).toBe('');

    responder(new Blob(['%PDF']));
    await estabilizar();

    expect(ventana.location.href).toBe('blob:fake');
  });

  it('cierra la pestaña y avisa cuando falla la descarga', async () => {
    const ventana = ventanaFalsa();
    vi.spyOn(window, 'open').mockReturnValue(ventana);
    auditoriasService.descargarDocumento.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    await montar();
    botonVerPdf()?.click();
    await estabilizar();

    expect(ventana.close).toHaveBeenCalled();
    const toasts = TestBed.inject(ToastService).toasts();
    expect(toasts[toasts.length - 1].title).toContain('No se pudo abrir el documento');
  });

  it('avisa cuando el navegador bloquea la ventana emergente', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    await montar();
    botonVerPdf()?.click();
    await estabilizar();

    expect(auditoriasService.descargarDocumento).not.toHaveBeenCalled();
    const toasts = TestBed.inject(ToastService).toasts();
    expect(toasts[toasts.length - 1].title).toContain('bloqueó la ventana emergente');
  });

  /**
   * El boton de volver estaba fijo en /empresa/panel, una ruta que el guard de empresa le bloquea
   * al auditor: desde su propio detalle, volver lo sacaba de la aplicacion en vez de devolverlo a
   * sus solicitudes.
   */
  it('el auditor vuelve a sus solicitudes asignadas y no al panel de empresa', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await montarComoAuditorAsignado();

    botonVolver()?.click();
    await estabilizar();

    expect(navegar).toHaveBeenCalledWith('/auditor/auditorias');
  });

  it('la empresa vuelve a su propio listado de auditorias', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await montar();

    botonVolver()?.click();
    await estabilizar();

    expect(navegar).toHaveBeenCalledWith('/empresa/auditorias');
  });

  it('deja de sondear al destruir el componente', async () => {
    await montar();

    fixture.destroy();
    vi.advanceTimersByTime(INTERVALO_SONDEO_DETALLE_MS * 2);

    expect(auditoriasService.obtenerDetalle).toHaveBeenCalledTimes(1);
  });
});
