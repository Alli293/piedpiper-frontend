import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ResumenSolicitudAuditoria } from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';
import { ListadoAuditoriasPageComponent } from './listado-auditorias-page.component';

describe('ListadoAuditoriasPageComponent', () => {
  let fixture: ComponentFixture<ListadoAuditoriasPageComponent>;
  let auditoriasService: {
    listarDeMiEmpresa: ReturnType<typeof vi.fn>;
    listarAsignadas: ReturnType<typeof vi.fn>;
  };

  const enRevision: ResumenSolicitudAuditoria = {
    id: 'sol-1',
    tipoCertificacion: 'INICIAL',
    periodoInicio: '2025-01-01',
    periodoFin: '2025-12-31',
    estado: 'EN_REVISION',
    estadoDescripcion: 'En revisión',
    fechaCreacion: '2026-06-02T14:32:00Z',
    nombreEmpresa: 'Café del Valle S.A.',
    idAuditor: 'aud-1',
    nombreAuditor: 'Ana Mora Vargas',
    fechaAsignacion: '2026-06-10T09:15:00Z',
    fechaAceptacion: '2026-06-10T09:20:00Z',
    cantidadDocumentos: 2,
  };

  const esperandoRespuesta: ResumenSolicitudAuditoria = {
    ...enRevision,
    id: 'sol-2',
    estado: 'SOLICITUD_ENVIADA',
    estadoDescripcion: 'Solicitud enviada',
    fechaAceptacion: null,
  };

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function filas(): HTMLElement[] {
    return Array.from(raiz().querySelectorAll('.ch-listado-auditorias__tabla tbody tr'));
  }

  async function estabilizar(): Promise<void> {
    for (let intento = 0; intento < 5; intento += 1) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  }

  async function montar(perspectiva: 'empresa' | 'auditor' = 'empresa'): Promise<void> {
    fixture = TestBed.createComponent(ListadoAuditoriasPageComponent);
    fixture.componentRef.setInput('perspectiva', perspectiva);
    await estabilizar();
  }

  beforeEach(async () => {
    auditoriasService = {
      listarDeMiEmpresa: vi.fn().mockReturnValue(of([enRevision, esperandoRespuesta])),
      listarAsignadas: vi.fn().mockReturnValue(of([esperandoRespuesta])),
    };

    await TestBed.configureTestingModule({
      imports: [ListadoAuditoriasPageComponent],
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
            getUserInitials: vi.fn().mockReturnValue('AD'),
            getUserId: vi.fn().mockReturnValue('u-1'),
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

  it('la empresa ve sus solicitudes con el auditor de cada una', async () => {
    await montar();

    expect(auditoriasService.listarDeMiEmpresa).toHaveBeenCalled();
    expect(filas()).toHaveLength(2);
    expect(raiz().textContent).toContain('Ana Mora Vargas');
  });

  it('el auditor ve solo las asignadas y no el boton de crear', async () => {
    await montar('auditor');

    expect(auditoriasService.listarAsignadas).toHaveBeenCalled();
    expect(auditoriasService.listarDeMiEmpresa).not.toHaveBeenCalled();
    expect(
      Array.from(raiz().querySelectorAll('button')).some(
        (b) => b.textContent?.trim() === 'Nueva solicitud'
      )
    ).toBe(false);
  });

  /**
   * Las que esperan respuesta llevan un plazo corriendo. Enterrarlas entre las ya respondidas es
   * como se pierde una por vencimiento, así que van primero aunque sean más viejas.
   */
  it('las que esperan respuesta del auditor se muestran primero', async () => {
    await montar();

    expect(filas()[0].textContent).toContain('Solicitud enviada');
  });

  it('un clic en Ver abre el detalle de esa solicitud', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await montar();

    filas()[0].querySelector('button')?.click();
    await estabilizar();

    expect(navegar).toHaveBeenCalledWith(['/empresa/auditorias', 'sol-2']);
  });

  /** El detalle es la misma pantalla, pero cada rol la abre bajo su propia sección. */
  it('el auditor abre el detalle bajo su propia ruta y no bajo la de empresa', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await montar('auditor');

    filas()[0].querySelector('button')?.click();
    await estabilizar();

    expect(navegar).toHaveBeenCalledWith(['/auditor/auditorias', 'sol-2']);
  });

  it('el boton de nueva solicitud lleva al formulario de creacion', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await montar();

    Array.from(raiz().querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'Nueva solicitud')
      ?.click();
    await estabilizar();

    expect(navegar).toHaveBeenCalledWith('/empresa/auditorias/nueva');
  });

  it('sin solicitudes ofrece crear la primera en vez de una tabla vacia', async () => {
    auditoriasService.listarDeMiEmpresa.mockReturnValue(of([]));

    await montar();

    expect(raiz().querySelector('.ch-listado-auditorias__vacio')?.textContent).toContain(
      'Todavía no has solicitado'
    );
    expect(raiz().querySelector('.ch-listado-auditorias__tabla')).toBeNull();
  });

  it('un fallo de carga muestra el error y no una tabla vacia', async () => {
    auditoriasService.listarDeMiEmpresa.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    await montar();

    expect(raiz().querySelector('.ch-listado-auditorias__error')).not.toBeNull();
    expect(raiz().querySelector('.ch-listado-auditorias__tabla')).toBeNull();
  });
});
