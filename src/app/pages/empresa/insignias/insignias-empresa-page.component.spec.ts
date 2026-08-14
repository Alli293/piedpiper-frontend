import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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
  idInsigniaEmpresa: '11111111-1111-1111-1111-111111111111',
  idInsignia: 1,
  nivelInsignia: 'bronce' as const,
  nombre: 'Carbono Neutral',
  descripcion: 'Insignia activa verificable.',
  fechaObtencion: '2026-01-15T00:00:00Z',
  criteriosObtencion: 'Debe mantener certificaciones activas.',
  emisor: 'CarbonHub',
  receptor: 'Cafe del Valle S.A.',
  urlVerificacionPublica:
    'https://carbonhub.test/api/insignias/11111111-1111-1111-1111-111111111111/verificacion',
  urlVerificacionJwt:
    'https://carbonhub.test/api/insignias/11111111-1111-1111-1111-111111111111/verificacion.jwt',
  urlLinkedIn: 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME',
  codigoVerificacion: 'CH-2026-8F4A19KD',
};

const PERFIL = {
  nombre: 'Ariela',
  apellidos: 'Jimenez',
  rol: 'ADMINISTRADOR_EMPRESA',
  empresa: { nombreEmpresa: 'Cafe del Valle S.A.' },
} as PerfilInicial;

describe('InsigniasEmpresaPageComponent', () => {
  let empresaService: {
    listarInsignias: ReturnType<typeof vi.fn>;
    descargarInsigniaJsonLd: ReturnType<typeof vi.fn>;
    descargarInsigniaJwt: ReturnType<typeof vi.fn>;
  };
  let toastService: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    empresaService = {
      listarInsignias: vi.fn().mockReturnValue(of([INSIGNIA])),
      descargarInsigniaJsonLd: vi
        .fn()
        .mockReturnValue(of(new Blob(['{}'], { type: 'application/ld+json' }))),
      descargarInsigniaJwt: vi
        .fn()
        .mockReturnValue(
          of(new Blob(['header.payload.signature'], { type: 'application/vc+ld+json+jwt' }))
        ),
    };
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

  function abrirDetalle(root: HTMLElement): void {
    const boton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Ver detalle')
    );
    boton?.click();
  }

  it('no muestra el boton de descarga JSON-LD en el detalle', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;
    abrirDetalle(root);
    fixture.detectChanges();
    const boton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Descargar JSON-LD')
    );

    expect(boton).toBeUndefined();
    expect(empresaService.descargarInsigniaJsonLd).not.toHaveBeenCalled();
  });

  it('muestra los botones de descargar JWT y compartir en el contexto privado', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;
    abrirDetalle(root);
    fixture.detectChanges();

    expect(root.textContent).toContain('Descargar (JWT)');
    expect(root.textContent).toContain('Compartir');
  });

  it('descarga el JWT de la insignia al hacer clic en Descargar (JWT)', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;
    abrirDetalle(root);
    fixture.detectChanges();
    const boton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Descargar (JWT)')
    );

    boton?.click();
    await fixture.whenStable();

    expect(empresaService.descargarInsigniaJwt).toHaveBeenCalledWith(INSIGNIA.urlVerificacionJwt);
  });

  it('abre LinkedIn al hacer clic en Compartir', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;
    abrirDetalle(root);
    fixture.detectChanges();
    const abrirVentana = vi.spyOn(window, 'open').mockReturnValue(null);
    const boton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Compartir')
    );

    boton?.click();

    expect(abrirVentana).toHaveBeenCalledWith(
      INSIGNIA.urlLinkedIn,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('navega a /verificar/:codigo al hacer clic en Verificar', async () => {
    const fixture = await crear();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;
    abrirDetalle(root);
    fixture.detectChanges();
    const botones = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));

    botones.find((b) => b.textContent?.trim() === 'Verificar')?.click();

    expect(navegar).toHaveBeenCalledWith(['/verificar', 'CH-2026-8F4A19KD']);
  });
});
