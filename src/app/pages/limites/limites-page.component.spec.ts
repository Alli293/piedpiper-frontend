import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../core/auth-session.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { LimitesPageComponent } from './limites-page.component';
import { LimitesService } from './limites.service';

describe('LimitesPageComponent', () => {
  let fixture: ComponentFixture<LimitesPageComponent>;
  let component: LimitesPageComponent;
  let toastService: ToastService;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let limitesService: {
    obtenerLimite: ReturnType<typeof vi.fn>;
    listarLimites: ReturnType<typeof vi.fn>;
    guardarLimite: ReturnType<typeof vi.fn>;
    eliminarLimite: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    limitesService = {
      obtenerLimite: vi.fn(),
      listarLimites: vi.fn(),
      guardarLimite: vi.fn(),
      eliminarLimite: vi.fn(),
    };
    limitesService.listarLimites.mockReturnValue(of([]));
    limitesService.obtenerLimite.mockReturnValue(
      of({
        id: 1,
        empresaId: '11111111-1111-1111-1111-111111111111',
        anio: new Date().getFullYear(),
        limiteMt: 50,
        justificacion: 'Meta anual',
        mensaje: '',
        actualizadoEn: null,
        recienCreada: false,
      })
    );
    limitesService.guardarLimite.mockReturnValue(
      of({
        id: 1,
        empresaId: '11111111-1111-1111-1111-111111111111',
        anio: new Date().getFullYear(),
        limiteMt: 40,
        justificacion: null,
        mensaje: '',
        actualizadoEn: null,
        recienCreada: false,
      })
    );

    await TestBed.configureTestingModule({
      imports: [LimitesPageComponent],
      providers: [
        provideRouter([]),
        ToastService,
        {
          provide: LimitesService,
          useValue: limitesService,
        },
        {
          provide: AuthSessionService,
          useValue: { isAdministradorEmpresa: () => true },
        },
        {
          provide: AuthService,
          useValue: { cerrarSesion: vi.fn() },
        },
      ],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(LimitesPageComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  function ultimoToast() {
    const toasts = toastService.toasts();
    return toasts[toasts.length - 1];
  }

  it('precarga el valor existente', () => {
    expect(limitesService.obtenerLimite).toHaveBeenCalledWith(new Date().getFullYear());
    expect((component as any).model().limiteMt).toBe('50');
  });

  it('vuelve al listado de emisiones desde el boton de retroceso', () => {
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.ch-header__back-button')?.click();

    expect(navigateByUrl).toHaveBeenCalledWith('/emisiones');
  });

  it('formulario invalido no llama al servicio de guardado', async () => {
    (component as any).model.update((m: any) => ({ ...m, limiteMt: '0' }));

    await (component as any).guardar();

    expect(limitesService.guardarLimite).not.toHaveBeenCalled();
  });

  it('formulario rechaza limite con mas de 12 digitos enteros', async () => {
    (component as any).model.update((m: any) => ({ ...m, limiteMt: '1234567890123.1234' }));

    await (component as any).guardar();

    expect(limitesService.guardarLimite).not.toHaveBeenCalled();
  });

  it('guardar muestra "creado" cuando la API indica recienCreada', async () => {
    const anioNuevo = new Date().getFullYear() + 1;
    limitesService.guardarLimite.mockReturnValue(
      of({
        id: 2,
        empresaId: '11111111-1111-1111-1111-111111111111',
        anio: anioNuevo,
        limiteMt: 15,
        justificacion: null,
        mensaje: '',
        actualizadoEn: null,
        recienCreada: true,
      })
    );
    (component as any).model.update((m: any) => ({
      ...m,
      anio: String(anioNuevo),
      limiteMt: '15',
    }));

    await (component as any).guardar();

    expect(ultimoToast()).toMatchObject({
      variant: 'success',
      title: `Límite del año ${anioNuevo} creado: 15 t CO₂e.`,
    });
  });

  it('guardar muestra "actualizado" cuando la API indica que no es recienCreada', async () => {
    limitesService.guardarLimite.mockReturnValue(
      of({
        id: 1,
        empresaId: '11111111-1111-1111-1111-111111111111',
        anio: new Date().getFullYear(),
        limiteMt: 60,
        justificacion: null,
        mensaje: '',
        actualizadoEn: null,
        recienCreada: false,
      })
    );
    (component as any).model.update((m: any) => ({ ...m, limiteMt: '60' }));

    await (component as any).guardar();

    expect(ultimoToast()).toMatchObject({
      variant: 'success',
      title: `Límite del año ${new Date().getFullYear()} actualizado: 60 t CO₂e.`,
    });
  });

  it('guardar muestra el mensaje de la API en un 403', async () => {
    limitesService.guardarLimite.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { message: 'Solo un administrador puede editar el límite.' },
          })
      )
    );

    await (component as any).guardar();

    expect(ultimoToast()).toMatchObject({
      variant: 'error',
      title: 'Solo un administrador puede editar el límite.',
    });
  });

  it('guardar usa el mensaje por defecto en un 403 sin mensaje de la API', async () => {
    limitesService.guardarLimite.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 }))
    );

    await (component as any).guardar();

    expect(ultimoToast()).toMatchObject({
      variant: 'error',
      title: 'No tiene permiso para modificar el límite de la empresa.',
    });
  });

  it('guardar muestra el mensaje de la API en un conflicto 409', async () => {
    limitesService.guardarLimite.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Ya existe un límite registrado para ese año.' },
          })
      )
    );

    await (component as any).guardar();

    expect(ultimoToast()).toMatchObject({
      variant: 'error',
      title: 'Ya existe un límite registrado para ese año.',
    });
  });

  it('guardar usa el mensaje por defecto en un 409 sin mensaje de la API', async () => {
    limitesService.guardarLimite.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 }))
    );

    await (component as any).guardar();

    expect(ultimoToast()).toMatchObject({
      variant: 'error',
      title: 'Conflicto al guardar el límite. Intente nuevamente.',
    });
  });

  it('eliminar muestra el mensaje de la API en un 403', () => {
    limitesService.eliminarLimite.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { message: 'No tiene permisos para realizar esta acción.' },
          })
      )
    );

    (component as any).eliminar(new Date().getFullYear());

    expect(ultimoToast()).toMatchObject({
      variant: 'error',
      title: 'No tiene permisos para realizar esta acción.',
    });
  });

  it('eliminar usa el mensaje por defecto en un 403 sin mensaje de la API', () => {
    limitesService.eliminarLimite.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 }))
    );

    (component as any).eliminar(new Date().getFullYear());

    expect(ultimoToast()).toMatchObject({
      variant: 'error',
      title: 'No tiene permiso para modificar el límite de la empresa.',
    });
  });
});
