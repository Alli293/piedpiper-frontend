import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../core/auth-session.service';
import { ToastService } from '../../core/toast.service';
import { LimitesPageComponent } from './limites-page.component';
import { LimitesService } from './limites.service';

describe('LimitesPageComponent', () => {
  let fixture: ComponentFixture<LimitesPageComponent>;
  let component: LimitesPageComponent;
  let toastService: ToastService;
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
      })
    );

    await TestBed.configureTestingModule({
      imports: [LimitesPageComponent],
      providers: [
        ToastService,
        {
          provide: LimitesService,
          useValue: limitesService,
        },
        {
          provide: AuthSessionService,
          useValue: { isAdministradorEmpresa: () => true },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LimitesPageComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('precarga el valor existente', () => {
    expect(limitesService.obtenerLimite).toHaveBeenCalledWith(new Date().getFullYear());
    expect((component as any).limiteMtControl.value).toBe('50');
  });

  it('formulario invalido no llama al servicio de guardado', () => {
    (component as any).limiteMtControl.setValue('0');

    (component as any).guardar();

    expect(limitesService.guardarLimite).not.toHaveBeenCalled();
  });

  it('formulario rechaza limite con mas de 12 digitos enteros', () => {
    (component as any).limiteMtControl.setValue('1234567890123.1234');

    (component as any).guardar();

    expect(limitesService.guardarLimite).not.toHaveBeenCalled();
  });

  it('guardar muestra el mensaje de la API en un 403', () => {
    limitesService.guardarLimite.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { message: 'Solo un administrador puede editar el límite.' },
          })
      )
    );

    (component as any).guardar();

    expect(toastService.message()).toBe('Solo un administrador puede editar el límite.');
  });

  it('guardar usa el mensaje por defecto en un 403 sin mensaje de la API', () => {
    limitesService.guardarLimite.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    (component as any).guardar();

    expect(toastService.message()).toBe('No tiene permiso para modificar el límite de la empresa.');
  });

  it('guardar muestra el mensaje de la API en un conflicto 409', () => {
    limitesService.guardarLimite.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Ya existe un límite registrado para ese año.' },
          })
      )
    );

    (component as any).guardar();

    expect(toastService.message()).toBe('Ya existe un límite registrado para ese año.');
  });

  it('guardar usa el mensaje por defecto en un 409 sin mensaje de la API', () => {
    limitesService.guardarLimite.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    (component as any).guardar();

    expect(toastService.message()).toBe('Conflicto al guardar el límite. Intente nuevamente.');
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

    expect(toastService.message()).toBe('No tiene permisos para realizar esta acción.');
  });

  it('eliminar usa el mensaje por defecto en un 403 sin mensaje de la API', () => {
    limitesService.eliminarLimite.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    (component as any).eliminar(new Date().getFullYear());

    expect(toastService.message()).toBe('No tiene permiso para modificar el límite de la empresa.');
  });
});
