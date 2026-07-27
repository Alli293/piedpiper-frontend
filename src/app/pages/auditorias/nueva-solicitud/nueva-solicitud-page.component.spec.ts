import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SolicitudAuditoria } from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';
import { NuevaSolicitudPageComponent } from './nueva-solicitud-page.component';

describe('NuevaSolicitudPageComponent', () => {
  let fixture: ComponentFixture<NuevaSolicitudPageComponent>;
  let component: NuevaSolicitudPageComponent;
  let toastService: ToastService;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let auditoriasService: { crearSolicitud: ReturnType<typeof vi.fn> };

  const solicitudCreada: SolicitudAuditoria = {
    id: 'sol-77',
    tipoCertificacion: 'INICIAL',
    periodoInicio: '2024-01-01',
    periodoFin: '2024-06-30',
    descripcionSolicitud: null,
    estado: 'SOLICITUD_ENVIADA',
    fechaCreacion: '2024-07-01T10:00:00Z',
    documentos: [{ id: 'doc-1', nombreArchivo: 'respaldo.pdf', tamanioBytes: 1024 }],
  };

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function interno() {
    return component as unknown as {
      model: {
        (): { periodoInicio: Date | null; periodoFin: Date | null; descripcionSolicitud: string };
        update(fn: (m: Record<string, unknown>) => Record<string, unknown>): void;
      };
    };
  }

  function pdf(nombre: string): File {
    return new File(['%PDF-1.7 contenido'], nombre, { type: 'application/pdf' });
  }

  async function adjuntar(...archivos: File[]): Promise<void> {
    const zona = raiz().querySelector<HTMLButtonElement>('.ch-file-drop__zone');
    const evento = new Event('drop');
    Object.defineProperty(evento, 'dataTransfer', { value: { files: archivos } });
    zona?.dispatchEvent(evento);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function completarPeriodo(): void {
    interno().model.update((m) => ({
      ...m,
      periodoInicio: new Date(Date.UTC(2024, 0, 1)),
      periodoFin: new Date(Date.UTC(2024, 5, 30)),
    }));
    fixture.detectChanges();
  }

  function botonEnviar(): HTMLButtonElement | null {
    return raiz().querySelector<HTMLButtonElement>('button[type="submit"]');
  }

  async function enviar(): Promise<void> {
    raiz().querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function ultimoToast() {
    const toasts = toastService.toasts();
    return toasts[toasts.length - 1];
  }

  beforeEach(async () => {
    auditoriasService = { crearSolicitud: vi.fn().mockReturnValue(of(solicitudCreada)) };

    await TestBed.configureTestingModule({
      imports: [NuevaSolicitudPageComponent],
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

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(NuevaSolicitudPageComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('deshabilita el boton mientras no haya documentos adjuntos', async () => {
    completarPeriodo();

    expect(botonEnviar()?.disabled).toBe(true);

    await adjuntar(pdf('respaldo.pdf'));

    expect(botonEnviar()?.disabled).toBe(false);
  });

  it('no habilita el envio cuando el periodo excede 12 meses', async () => {
    interno().model.update((m) => ({
      ...m,
      periodoInicio: new Date(Date.UTC(2023, 0, 1)),
      periodoFin: new Date(Date.UTC(2024, 6, 1)),
    }));
    await adjuntar(pdf('respaldo.pdf'));

    expect(botonEnviar()?.disabled).toBe(true);
  });

  it('envia el periodo en formato ISO junto con los documentos adjuntos', async () => {
    completarPeriodo();
    await adjuntar(pdf('respaldo.pdf'), pdf('anexo.pdf'));

    await enviar();

    expect(auditoriasService.crearSolicitud).toHaveBeenCalledTimes(1);
    const [datos, documentos] = auditoriasService.crearSolicitud.mock.calls[0];
    expect(datos).toEqual({
      periodoInicio: '2024-01-01',
      periodoFin: '2024-06-30',
      descripcionSolicitud: null,
    });
    expect((documentos as File[]).map((documento) => documento.name)).toEqual([
      'respaldo.pdf',
      'anexo.pdf',
    ]);
  });

  it('navega a la pantalla de asignacion de auditor tras crear la solicitud', async () => {
    completarPeriodo();
    await adjuntar(pdf('respaldo.pdf'));

    await enviar();

    expect(ultimoToast().variant).toBe('success');
    expect(navigateByUrl).toHaveBeenCalledWith('/empresa/auditorias/sol-77/auditor');
  });

  it('muestra el mensaje del backend ante un traslape y conserva los datos', async () => {
    auditoriasService.crearSolicitud.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Ya existe una auditoría para un período traslapado.' },
          })
      )
    );
    completarPeriodo();
    interno().model.update((m) => ({ ...m, descripcionSolicitud: 'Revisión anual' }));
    await adjuntar(pdf('respaldo.pdf'));

    await enviar();

    expect(ultimoToast().variant).toBe('error');
    expect(ultimoToast().title).toBe('Ya existe una auditoría para un período traslapado.');
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(interno().model().descripcionSolicitud).toBe('Revisión anual');
    expect(interno().model().periodoInicio).toEqual(new Date(Date.UTC(2024, 0, 1)));
    expect(raiz().querySelectorAll('.ch-file-drop__item-name').length).toBe(1);
  });

  it('muestra el mensaje del backend ante un periodo invalido', async () => {
    auditoriasService.crearSolicitud.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { message: 'El período a auditar no puede exceder 12 meses.' },
          })
      )
    );
    completarPeriodo();
    await adjuntar(pdf('respaldo.pdf'));

    await enviar();

    expect(ultimoToast().title).toBe('El período a auditar no puede exceder 12 meses.');
  });
});
