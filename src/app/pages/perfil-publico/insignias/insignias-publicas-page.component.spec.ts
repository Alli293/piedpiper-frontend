import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { InsigniaEmpresa } from '../../../core/empresa/empresa.models';
import { ToastService } from '../../../shared/services/toast.service';
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
};

describe('InsigniasPublicasPageComponent', () => {
  let perfilPublicoService: {
    listarInsignias: ReturnType<typeof vi.fn>;
    descargarInsigniaJsonLd: ReturnType<typeof vi.fn>;
    descargarInsigniaJwt: ReturnType<typeof vi.fn>;
  };
  let locationBack: ReturnType<typeof vi.fn>;
  let toastService: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    perfilPublicoService = {
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
    locationBack = vi.fn();
    toastService = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [InsigniasPublicasPageComponent],
      providers: [
        provideRouter([]),
        { provide: PerfilPublicoService, useValue: perfilPublicoService },
        { provide: Location, useValue: { back: locationBack } },
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
    expect(root.textContent).toContain('Descargar .JWT');
    expect(root.textContent).toContain('Compartir en LinkedIn');
  });

  it('permite compartir en LinkedIn desde la vista publica', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const botones = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));

    botones.find((button) => button.textContent?.includes('Compartir en LinkedIn'))?.click();

    expect(perfilPublicoService.descargarInsigniaJsonLd).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('https://www.linkedin.com/profile/add?'),
      '_blank',
      'noopener'
    );

    open.mockRestore();
  });

  it('descarga el JWT real desde la vista publica', async () => {
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const botones = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));

    botones.find((button) => button.textContent?.includes('Descargar .JWT'))?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(perfilPublicoService.descargarInsigniaJwt).toHaveBeenCalledWith(
      INSIGNIA.urlVerificacionJwt
    );
    expect(click).toHaveBeenCalled();
    click.mockRestore();
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
});
