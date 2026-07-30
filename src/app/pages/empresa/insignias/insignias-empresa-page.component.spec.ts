import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { AuthSessionService } from '../../../core/auth-session.service';
import { EmpresaService } from '../../../core/empresa/empresa.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { InsigniasEmpresaPageComponent } from './insignias-empresa-page.component';

const INSIGNIA = {
  idInsignia: 1,
  nivelInsignia: 'bronce' as const,
  nombre: 'Carbono Neutral',
  descripcion: 'Insignia activa verificable.',
  fechaObtencion: '2026-01-15T00:00:00Z',
};

const PERFIL = {
  nombre: 'Ariela',
  apellidos: 'Jimenez',
  rol: 'ADMINISTRADOR_EMPRESA',
  empresa: { nombreEmpresa: 'Cafe del Valle S.A.' },
} as PerfilInicial;

describe('InsigniasEmpresaPageComponent', () => {
  let empresaService: { listarInsignias: ReturnType<typeof vi.fn> };
  let toastService: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    empresaService = { listarInsignias: vi.fn().mockReturnValue(of([INSIGNIA])) };
    toastService = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [InsigniasEmpresaPageComponent],
      providers: [
        provideRouter([]),
        { provide: EmpresaService, useValue: empresaService },
        { provide: ToastService, useValue: toastService },
        { provide: AuthService, useValue: { cerrarSesion: vi.fn() } },
        { provide: SesionInactividadService, useValue: { detener: vi.fn() } },
        {
          provide: AuthSessionService,
          useValue: {
            getRole: vi.fn().mockReturnValue('administrador_empresa'),
            getUserName: vi.fn().mockReturnValue('Ariela'),
            getUserInitials: vi.fn().mockReturnValue('AJ'),
            getUserEmail: vi.fn().mockReturnValue('ariela@test.com'),
            getUserId: vi.fn().mockReturnValue('1'),
            isAdministradorEmpresa: vi.fn().mockReturnValue(true),
          },
        },
        {
          provide: PerfilInicialService,
          useValue: { perfil: signal(PERFIL), obtener: vi.fn().mockReturnValue(of(PERFIL)) },
        },
      ],
    }).compileComponents();
  });

  async function crear(): Promise<ComponentFixture<InsigniasEmpresaPageComponent>> {
    const fixture = TestBed.createComponent(InsigniasEmpresaPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('carga las insignias de la empresa autenticada en su apartado propio', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(empresaService.listarInsignias).toHaveBeenCalled();
    expect(root.textContent).toContain('Insignias activas');
    expect(root.textContent).toContain('Carbono Neutral');
  });

  it('muestra estado de error y expone el mensaje de permisos del API', async () => {
    empresaService.listarInsignias.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 403,
            error: { message: 'No tienes permiso para ver estas insignias.' },
          })
      )
    );

    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('No se pudieron cargar las insignias empresariales.');
    expect(toastService.error).toHaveBeenCalledWith('No tienes permiso para ver estas insignias.');
  });
});
