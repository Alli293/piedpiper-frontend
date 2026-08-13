import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { MetaReduccion } from '../metas.model';
import { MetasService } from '../metas.service';
import { RegistrarMetaPageComponent } from './registrar-meta-page.component';

describe('RegistrarMetaPageComponent', () => {
  let fixture: ComponentFixture<RegistrarMetaPageComponent>;
  let component: RegistrarMetaPageComponent;
  let toastService: ToastService;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let metasService: {
    crearMeta: ReturnType<typeof vi.fn>;
    listarMetas: ReturnType<typeof vi.fn>;
    actualizarMeta: ReturnType<typeof vi.fn>;
    eliminarMeta: ReturnType<typeof vi.fn>;
  };

  const metaCreada: MetaReduccion = {
    id: 'm1',
    nombreMeta: 'Reducir huella total',
    valorObjetivoHuellaT: 50,
    fechaLimite: '2027-12-31',
    huellaActualT: 30,
    progresoPorcentaje: 60,
    vencida: false,
    fechaCreacion: '2026-08-06T00:00:00Z',
  };

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function interno() {
    return component as unknown as {
      model: {
        (): { nombreMeta: string; valorObjetivoHuellaT: number | null; fechaLimite: Date | null };
        update(fn: (m: Record<string, unknown>) => Record<string, unknown>): void;
      };
    };
  }

  function completarFormulario(
    overrides: Partial<{
      nombreMeta: string;
      valorObjetivoHuellaT: number | null;
      fechaLimite: Date | null;
    }> = {}
  ): void {
    interno().model.update((m) => ({
      ...m,
      nombreMeta: 'Reducir huella total',
      valorObjetivoHuellaT: 50,
      fechaLimite: new Date(Date.UTC(2027, 11, 31)),
      ...overrides,
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
    metasService = {
      crearMeta: vi.fn().mockReturnValue(of(metaCreada)),
      listarMetas: vi.fn().mockReturnValue(of([metaCreada])),
      actualizarMeta: vi.fn().mockReturnValue(of(metaCreada)),
      eliminarMeta: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [RegistrarMetaPageComponent],
      providers: [
        provideRouter([]),
        ToastService,
        { provide: MetasService, useValue: metasService },
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
    fixture = TestBed.createComponent(RegistrarMetaPageComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('el boton esta deshabilitado mientras el formulario este vacio', () => {
    expect(botonEnviar()?.disabled).toBe(true);
  });

  it('valida que el nombre tenga entre 3 y 100 caracteres', () => {
    completarFormulario({ nombreMeta: 'ab' });

    expect(botonEnviar()?.disabled).toBe(true);
  });

  it('valida que el objetivo sea un numero positivo', () => {
    completarFormulario({ valorObjetivoHuellaT: 0 });

    expect(botonEnviar()?.disabled).toBe(true);
  });

  it('deshabilita el envio cuando la fecha limite ya paso', () => {
    completarFormulario({ fechaLimite: new Date(Date.UTC(2020, 0, 1)) });

    expect(botonEnviar()?.disabled).toBe(true);
  });

  it('habilita el envio con un formulario valido', () => {
    completarFormulario();

    expect(botonEnviar()?.disabled).toBe(false);
  });

  it('crea la meta con el cuerpo correcto y redirige a certificaciones', async () => {
    completarFormulario();

    await enviar();

    expect(metasService.crearMeta).toHaveBeenCalledWith({
      nombreMeta: 'Reducir huella total',
      valorObjetivoHuellaT: 50,
      fechaLimite: '2027-12-31',
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/empresa/certificaciones');
    expect(ultimoToast()?.title).toContain('Meta de reducción registrada.');
  });

  it('muestra un error y no navega si falla la creacion', async () => {
    metasService.crearMeta.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    completarFormulario();

    await enviar();

    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(ultimoToast()?.title).toContain('No se pudo registrar la meta');
  });

  it('carga el listado de metas al iniciar', () => {
    expect(metasService.listarMetas).toHaveBeenCalled();
    expect((component as unknown as { metas: () => MetaReduccion[] }).metas()).toEqual([
      metaCreada,
    ]);
  });

  it('editar precarga el formulario y actualiza en vez de crear', async () => {
    (component as unknown as { editar: (m: MetaReduccion) => void }).editar(metaCreada);
    fixture.detectChanges();

    await enviar();

    expect(metasService.actualizarMeta).toHaveBeenCalledWith('m1', {
      nombreMeta: 'Reducir huella total',
      valorObjetivoHuellaT: 50,
      fechaLimite: '2027-12-31',
    });
    expect(metasService.crearMeta).not.toHaveBeenCalled();
    expect(ultimoToast()?.title).toContain('Meta actualizada.');
  });

  it('solicitarEliminar seguido de eliminar llama al servicio y recarga el listado', () => {
    const comp = component as unknown as {
      solicitarEliminar: (id: string) => void;
      eliminar: (id: string) => void;
    };

    comp.solicitarEliminar('m1');
    comp.eliminar('m1');

    expect(metasService.eliminarMeta).toHaveBeenCalledWith('m1');
    expect(metasService.listarMetas).toHaveBeenCalledTimes(2);
    expect(ultimoToast()?.title).toContain('Meta eliminada.');
  });

  it('muestra un error si falla la eliminacion', () => {
    metasService.eliminarMeta.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 }))
    );
    const comp = component as unknown as { eliminar: (id: string) => void };

    comp.eliminar('m1');

    expect(ultimoToast()?.title).toContain('No se pudo eliminar la meta');
  });
});
