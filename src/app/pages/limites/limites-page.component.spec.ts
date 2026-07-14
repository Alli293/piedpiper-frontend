import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../core/auth-session.service';
import { ToastService } from '../../core/toast.service';
import { LimitesPageComponent } from './limites-page.component';
import { LimitesService } from './limites.service';

describe('LimitesPageComponent', () => {
  let fixture: ComponentFixture<LimitesPageComponent>;
  let component: LimitesPageComponent;
  let limitesService: {
    obtenerLimite: ReturnType<typeof vi.fn>;
    listarLimites: ReturnType<typeof vi.fn>;
    guardarLimite: ReturnType<typeof vi.fn>;
    actualizarLimite: ReturnType<typeof vi.fn>;
    eliminarLimite: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    limitesService = {
      obtenerLimite: vi.fn(),
      listarLimites: vi.fn(),
      guardarLimite: vi.fn(),
      actualizarLimite: vi.fn(),
      eliminarLimite: vi.fn(),
    };
    limitesService.listarLimites.mockReturnValue(of([]));
    limitesService.obtenerLimite.mockReturnValue(
      of({
        id: 1,
        empresaId: 7,
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
        empresaId: 7,
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
          useValue: { isAdministradorEmpresa: () => true, getEmpresaId: () => 7 },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LimitesPageComponent);
    component = fixture.componentInstance;
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
});
