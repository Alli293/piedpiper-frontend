import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SolicitudesAuditorPageComponent } from './solicitudes-auditor-page.component';
import {
  PaginaSolicitudes,
  SolicitudPendiente,
  ValidacionService,
} from '../../../core/validacion/validacion.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('SolicitudesAuditorPageComponent', () => {
  let validacionService: {
    listarPendientes: ReturnType<typeof vi.fn>;
    resolver: ReturnType<typeof vi.fn>;
  };
  let toastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    toasts: () => [];
  };

  const solicitud: SolicitudPendiente = {
    id: 'sol-1',
    nombreAuditor: 'Ana Mora',
    email: 'ana@correo.com',
    fechaSolicitud: '2026-07-14T00:00:00Z',
  };

  const pagina: PaginaSolicitudes = {
    contenido: [solicitud],
    pagina: 0,
    totalPaginas: 1,
    totalElementos: 1,
  };

  beforeEach(async () => {
    validacionService = {
      listarPendientes: vi.fn().mockReturnValue(of(pagina)),
      resolver: vi.fn(),
    };
    toastService = { success: vi.fn(), error: vi.fn(), toasts: () => [] };

    await TestBed.configureTestingModule({
      imports: [SolicitudesAuditorPageComponent],
      providers: [
        { provide: ValidacionService, useValue: validacionService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(SolicitudesAuditorPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('pinta la tabla con las solicitudes pendientes', () => {
    const fixture = crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent;

    expect(texto).toContain('Ana Mora');
    expect(texto).toContain('ana@correo.com');
  });

  it('sin solicitudes muestra el mensaje de vacio', () => {
    validacionService.listarPendientes.mockReturnValue(
      of({ contenido: [], pagina: 0, totalPaginas: 0, totalElementos: 0 })
    );
    const fixture = crear();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No hay solicitudes pendientes en este momento.'
    );
  });

  it('si falla la carga inicial muestra el error con reintentar y no el vacio', () => {
    validacionService.listarPendientes.mockReturnValue(throwError(() => ({ status: 500 })));
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    const html = fixture.nativeElement as HTMLElement;

    expect(comp.errorCarga()).toBe(true);
    expect(html.textContent).toContain('No pudimos cargar las solicitudes. Intenta nuevamente.');
    expect(html.textContent).not.toContain('No hay solicitudes pendientes en este momento.');
  });

  it('el modal se cierra con Escape', () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.abrirRevision(solicitud);
    fixture.detectChanges();
    const modal = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="dialog"]'
    ) as HTMLElement;

    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(comp.solicitudEnRevision()).toBeNull();
  });

  it('el campo de motivo aparece solo al rechazar', () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.abrirRevision(solicitud);
    comp.model.set({ decision: 'aprobado', motivo: '' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-textarea')).toBeNull();

    comp.model.set({ decision: 'rechazado', motivo: '' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-textarea')).toBeTruthy();
  });

  it('sin decision seleccionada el boton confirmar queda deshabilitado', () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.abrirRevision(solicitud);

    expect(comp.puedeConfirmar()).toBe(false);

    comp.model.set({ decision: 'aprobado', motivo: '' });
    expect(comp.puedeConfirmar()).toBe(true);
  });

  it('el boton confirmar se habilita segun la longitud del motivo', () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.abrirRevision(solicitud);

    comp.model.set({ decision: 'rechazado', motivo: 'corto' });
    expect(comp.puedeConfirmar()).toBe(false);

    comp.model.set({ decision: 'rechazado', motivo: 'Motivo de rechazo con largo suficiente.' });
    expect(comp.puedeConfirmar()).toBe(true);

    comp.model.set({ decision: 'rechazado', motivo: 'x'.repeat(501) });
    expect(comp.puedeConfirmar()).toBe(false);
  });

  it('confirmar con motivo invalido no llama al backend y marca el error', async () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.abrirRevision(solicitud);
    comp.model.set({ decision: 'rechazado', motivo: 'corto' });

    await comp.confirmarDecision();
    fixture.detectChanges();

    expect(validacionService.resolver).not.toHaveBeenCalled();
    expect(comp.errorMotivo()).toBe('El motivo debe tener entre 10 y 500 caracteres.');
  });

  it('aprobar resuelve, notifica y recarga la lista', async () => {
    validacionService.resolver.mockReturnValue(
      of({
        id: 'sol-1',
        estado: 'APROBADO',
        estadoAuditor: 'ACTIVO',
        fechaResolucion: '2026-07-15T00:00:00Z',
        motivoRechazo: null,
      })
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.abrirRevision(solicitud);
    comp.model.set({ decision: 'aprobado', motivo: '' });

    await comp.confirmarDecision();

    expect(validacionService.resolver).toHaveBeenCalledWith('sol-1', 'aprobado', undefined);
    expect(toastService.success).toHaveBeenCalled();
    expect(validacionService.listarPendientes).toHaveBeenCalledTimes(2);
    expect(comp.solicitudEnRevision()).toBeNull();
  });

  it('al resolver la ultima solicitud de una pagina > 0 recarga la pagina anterior', async () => {
    validacionService.listarPendientes.mockReturnValue(
      of({ contenido: [solicitud], pagina: 1, totalPaginas: 2, totalElementos: 4 })
    );
    validacionService.resolver.mockReturnValue(
      of({
        id: 'sol-1',
        estado: 'APROBADO',
        estadoAuditor: 'ACTIVO',
        fechaResolucion: '2026-07-15T00:00:00Z',
        motivoRechazo: null,
      })
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.abrirRevision(solicitud);
    comp.model.set({ decision: 'aprobado', motivo: '' });

    await comp.confirmarDecision();

    expect(validacionService.listarPendientes).toHaveBeenLastCalledWith(0);
  });

  it('un 409 muestra el toast y recarga el listado', async () => {
    validacionService.resolver.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Esta solicitud ya fue procesada por otro administrador.' },
          })
      )
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.abrirRevision(solicitud);
    comp.model.set({ decision: 'aprobado', motivo: '' });

    await comp.confirmarDecision();

    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo aplicar la decisión',
      'Esta solicitud ya fue procesada por otro administrador.'
    );
    expect(validacionService.listarPendientes).toHaveBeenCalledTimes(2);
  });
});
