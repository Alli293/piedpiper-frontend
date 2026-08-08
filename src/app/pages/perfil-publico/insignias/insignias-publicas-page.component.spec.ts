import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { InsigniaEmpresa } from '../../../core/empresa/empresa.models';
import { ToastService } from '../../../shared/services/toast.service';
import { PerfilPublicoDTO } from '../perfil-publico.models';
import { PerfilPublicoService } from '../perfil-publico.service';
import { InsigniasPublicasPageComponent } from './insignias-publicas-page.component';

const INSIGNIA: InsigniaEmpresa = {
  idInsignia: 1,
  nivelInsignia: 'bronce',
  nombre: 'Carbono Neutral',
  descripcion: 'Insignia activa verificable.',
  fechaObtencion: '2026-01-15T00:00:00Z',
  emisor: 'CarbonHub',
  urlVerificacionPublica:
    'https://carbonhub.test/api/insignias/11111111-1111-1111-1111-111111111111/verificacion',
  urlVerificacionJwt:
    'https://carbonhub.test/api/insignias/11111111-1111-1111-1111-111111111111/verificacion.jwt',
  codigoVerificacion: 'CH-2026-8F4A19KD',
};

const PERFIL: PerfilPublicoDTO = {
  nombreEmpresa: 'Café del Valle S.A.',
  logoUrl: null,
  sectorIndustrial: 'AGRICULTURA',
  pais: 'Costa Rica',
  nivelEcologico: 'Oro',
  fechaActualizacionNivel: '2026-01-01T00:00:00Z',
  certificacionesVigentes: 3,
  insigniasActivas: 1,
};

describe('InsigniasPublicasPageComponent', () => {
  let perfilPublicoService: {
    listarInsignias: ReturnType<typeof vi.fn>;
    obtenerPerfil: ReturnType<typeof vi.fn>;
    descargarInsigniaJsonLd: ReturnType<typeof vi.fn>;
    descargarInsigniaJwt: ReturnType<typeof vi.fn>;
  };
  let toastService: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    perfilPublicoService = {
      listarInsignias: vi.fn().mockReturnValue(of([INSIGNIA])),
      obtenerPerfil: vi.fn().mockReturnValue(of(PERFIL)),
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
      imports: [InsigniasPublicasPageComponent],
      providers: [
        provideRouter([]),
        { provide: PerfilPublicoService, useValue: perfilPublicoService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();
  });

  async function crear(
    slug = 'cafe-del-valle'
  ): Promise<ComponentFixture<InsigniasPublicasPageComponent>> {
    const fixture = TestBed.createComponent(InsigniasPublicasPageComponent);
    fixture.componentRef.setInput('slug', slug);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('consulta las insignias del perfil publico por slug y las muestra sin login', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(perfilPublicoService.listarInsignias).toHaveBeenCalledWith('cafe-del-valle');
    expect(root.textContent).toContain('Iniciar sesión');
    expect(root.textContent).toContain('Insignias activas');
    expect(root.textContent).toContain('Carbono Neutral');
    expect(root.textContent).not.toContain('Descargar JSON-LD');
    expect(root.textContent).not.toContain('Descargar .JWT');
    expect(root.textContent).not.toContain('Compartir en LinkedIn');
  });

  it('navega a /verificar/:codigo al hacer clic en Verificar con OpenBadges 3.0', async () => {
    const fixture = await crear();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;
    const botones = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));

    botones.find((button) => button.textContent?.includes('Verificar con OpenBadges 3.0'))?.click();

    expect(navegar).toHaveBeenCalledWith(['/verificar', 'CH-2026-8F4A19KD']);
  });

  it('el boton Volver navega a la reputacion de la empresa, no al historial del navegador', async () => {
    const fixture = await crear('cafe-del-valle');
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;

    const botonVolver: HTMLButtonElement | null = root.querySelector('.ch-pp-header__volver');
    botonVolver?.click();

    expect(navegar).toHaveBeenCalledWith(['/empresa', 'cafe-del-valle', 'reputacion']);
  });

  it('un 404 muestra el estado de perfil no encontrado', async () => {
    perfilPublicoService.listarInsignias.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'x' } }))
    );

    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('El perfil que buscas no existe');
    expect(root.querySelector('.ch-ie__card')).toBeNull();
  });

  it('un error de servidor permite reintentar la consulta', async () => {
    perfilPublicoService.listarInsignias.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('No fue posible cargar las insignias en este momento.');

    perfilPublicoService.listarInsignias.mockReturnValue(of([INSIGNIA]));
    const reintentar = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Reintentar')
    );
    reintentar?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(perfilPublicoService.listarInsignias).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain('Carbono Neutral');
  });

  it('muestra el nombre de la empresa en el breadcrumb y en el titulo de la lista', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(perfilPublicoService.obtenerPerfil).toHaveBeenCalledWith('cafe-del-valle');
    expect(root.querySelector('.ch-pp-header__crumb-link')?.textContent?.trim()).toBe(
      'Café del Valle S.A.'
    );
    expect(root.textContent).toContain('Insignias activas de Café del Valle S.A.');
  });

  it('si falla la carga del perfil, la lista de insignias igual se muestra', async () => {
    perfilPublicoService.obtenerPerfil.mockReturnValue(throwError(() => new Error('falla red')));
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Carbono Neutral');
    expect(root.querySelector('.ch-pp-header__crumb-link')?.textContent?.trim()).toBe(
      'Perfil público'
    );
  });
});
