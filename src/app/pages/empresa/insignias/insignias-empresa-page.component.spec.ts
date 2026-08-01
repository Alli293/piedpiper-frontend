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

  it('no muestra el boton de descarga JSON-LD en el detalle', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;
    const boton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Descargar JSON-LD')
    );

    expect(boton).toBeUndefined();
    expect(empresaService.descargarInsigniaJsonLd).not.toHaveBeenCalled();
  });

  it('descarga el JWT real desde el boton de detalle', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const boton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Descargar .JWT')
    );

    boton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(empresaService.descargarInsigniaJwt).toHaveBeenCalledWith(INSIGNIA.urlVerificacionJwt);
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('abre LinkedIn y la verificacion OpenBadges en nueva pestana', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;
    const botones = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
    const urlValidador = `https://certlister.com/ob3-validator/?url=${encodeURIComponent(
      INSIGNIA.urlVerificacionJwt
    )}`;

    botones.find((b) => b.textContent?.includes('Compartir en LinkedIn'))?.click();
    botones.find((b) => b.textContent?.includes('Verificar con OpenBadges 3.0'))?.click();

    expect(open).toHaveBeenCalledWith(INSIGNIA.urlLinkedIn, '_blank', 'noopener');
    expect(open).toHaveBeenCalledWith(urlValidador, '_blank', 'noopener');

    open.mockRestore();
  });
});
