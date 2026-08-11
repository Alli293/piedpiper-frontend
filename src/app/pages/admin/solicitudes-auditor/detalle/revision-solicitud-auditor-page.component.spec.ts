import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RevisionSolicitudAuditorPageComponent } from './revision-solicitud-auditor-page.component';
import {
  SolicitudDetalle,
  ValidacionService,
} from '../../../../core/validacion/validacion.service';
import { ToastService } from '../../../../shared/services/toast.service';

describe('RevisionSolicitudAuditorPageComponent', () => {
  let fixture: ComponentFixture<RevisionSolicitudAuditorPageComponent>;
  let component: RevisionSolicitudAuditorPageComponent;
  let toastService: ToastService;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let validacionService: {
    obtenerDetalle: ReturnType<typeof vi.fn>;
    resolver: ReturnType<typeof vi.fn>;
    descargarDocumento: ReturnType<typeof vi.fn>;
  };

  const detalle: SolicitudDetalle = {
    id: 'sol-1',
    nombreAuditor: 'Ana Mora',
    email: 'ana@correo.com',
    estado: 'PENDIENTE',
    fechaSolicitud: '2026-07-14T00:00:00Z',
    aniosExperiencia: 5,
    especialidades: ['AGROINDUSTRIA'],
    descripcionProfesional: 'Auditora con experiencia en agroindustria.',
    sitioWeb: null,
    documentos: [{ id: 'doc-1', nombreArchivo: 'certificado.pdf', tamanioBytes: 2048 }],
  };

  function interno() {
    return component as unknown as {
      model: {
        (): { decision: string; motivo: string };
        set(v: { decision: string; motivo: string }): void;
      };
      confirmarDecision(): Promise<void>;
      puedeConfirmar(): boolean;
      errorMotivo(): string;
      confirmandoDecision(): boolean;
    };
  }

  beforeEach(async () => {
    validacionService = {
      obtenerDetalle: vi.fn().mockReturnValue(of(detalle)),
      resolver: vi.fn(),
      descargarDocumento: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RevisionSolicitudAuditorPageComponent],
      providers: [
        provideRouter([]),
        { provide: ValidacionService, useValue: validacionService },
        ToastService,
      ],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(RevisionSolicitudAuditorPageComponent);
    fixture.componentRef.setInput('id', 'sol-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('muestra los datos del auditor y sus documentos', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent;

    expect(texto).toContain('Ana Mora');
    expect(texto).toContain('ana@correo.com');
    expect(texto).toContain('certificado.pdf');
  });

  it('el campo de motivo aparece solo al rechazar', () => {
    interno().model.set({ decision: 'aprobado', motivo: '' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-textarea')).toBeNull();

    interno().model.set({ decision: 'rechazado', motivo: '' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-textarea')).toBeTruthy();
  });

  it('sin decision seleccionada el boton confirmar queda deshabilitado', () => {
    expect(interno().puedeConfirmar()).toBe(false);

    interno().model.set({ decision: 'aprobado', motivo: '' });
    expect(interno().puedeConfirmar()).toBe(true);
  });

  it('el boton confirmar se habilita segun la longitud del motivo', () => {
    interno().model.set({ decision: 'rechazado', motivo: 'corto' });
    expect(interno().puedeConfirmar()).toBe(false);

    interno().model.set({
      decision: 'rechazado',
      motivo: 'Motivo de rechazo con largo suficiente.',
    });
    expect(interno().puedeConfirmar()).toBe(true);

    interno().model.set({ decision: 'rechazado', motivo: 'x'.repeat(501) });
    expect(interno().puedeConfirmar()).toBe(false);
  });

  it('confirmar con motivo invalido no llama al backend y marca el error', async () => {
    interno().model.set({ decision: 'rechazado', motivo: 'corto' });

    await interno().confirmarDecision();
    fixture.detectChanges();

    expect(validacionService.resolver).not.toHaveBeenCalled();
    expect(interno().errorMotivo()).toBe('El motivo debe tener entre 10 y 500 caracteres.');
  });

  it('aprobar resuelve, notifica y vuelve al listado', async () => {
    validacionService.resolver.mockReturnValue(
      of({
        id: 'sol-1',
        estado: 'APROBADO',
        estadoAuditor: 'ACTIVO',
        fechaResolucion: '2026-07-15T00:00:00Z',
        motivoRechazo: null,
      })
    );
    toastService = TestBed.inject(ToastService);
    interno().model.set({ decision: 'aprobado', motivo: '' });

    await interno().confirmarDecision();

    expect(validacionService.resolver).toHaveBeenCalledWith('sol-1', 'aprobado', undefined);
    expect(navigateByUrl).toHaveBeenCalledWith('/admin/solicitudes-auditor');
  });

  it('rechazar pide confirmacion antes de llamar al backend', () => {
    interno().model.set({ decision: 'rechazado', motivo: 'Motivo suficientemente largo.' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(interno().confirmandoDecision()).toBe(true);
    expect(validacionService.resolver).not.toHaveBeenCalled();
  });

  it('aprobar tambien pide confirmacion antes de llamar al backend', () => {
    interno().model.set({ decision: 'aprobado', motivo: '' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(interno().confirmandoDecision()).toBe(true);
    expect(validacionService.resolver).not.toHaveBeenCalled();
  });

  it('un 409 muestra el toast y vuelve al listado', async () => {
    validacionService.resolver.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Esta solicitud ya fue procesada por otro administrador.' },
          })
      )
    );
    toastService = TestBed.inject(ToastService);
    interno().model.set({ decision: 'aprobado', motivo: '' });

    await interno().confirmarDecision();

    expect(navigateByUrl).toHaveBeenCalledWith('/admin/solicitudes-auditor');
  });
});
