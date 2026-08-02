import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { InsigniaEmpresa } from '../../../core/empresa/empresa.models';
import { PerfilPublicoService } from '../perfil-publico.service';
import { InsigniasPublicasPageComponent } from './insignias-publicas-page.component';

const INSIGNIA: InsigniaEmpresa = {
  idInsignia: 1,
  nivelInsignia: 'bronce',
  nombre: 'Carbono Neutral',
  descripcion: 'Insignia activa verificable.',
  fechaObtencion: '2026-01-15T00:00:00Z',
};

describe('InsigniasPublicasPageComponent', () => {
  let listarInsignias: ReturnType<typeof vi.fn>;
  let locationBack: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    listarInsignias = vi.fn().mockReturnValue(of([INSIGNIA]));
    locationBack = vi.fn();

    await TestBed.configureTestingModule({
      imports: [InsigniasPublicasPageComponent],
      providers: [
        provideRouter([]),
        { provide: PerfilPublicoService, useValue: { listarInsignias } },
        { provide: Location, useValue: { back: locationBack } },
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

    expect(listarInsignias).toHaveBeenCalledWith('cafe-del-valle');
    expect(root.textContent).toContain('Iniciar sesión');
    expect(root.textContent).toContain('Insignias activas');
    expect(root.textContent).toContain('Carbono Neutral');
  });

  it('un 404 muestra el estado de perfil no encontrado', async () => {
    listarInsignias.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'x' } }))
    );

    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('El perfil que buscas no existe');
    expect(root.querySelector('.ch-ie__card')).toBeNull();
  });

  it('un error de servidor permite reintentar la consulta', async () => {
    listarInsignias.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('No fue posible cargar las insignias en este momento.');

    listarInsignias.mockReturnValue(of([INSIGNIA]));
    const reintentar = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Reintentar')
    );
    reintentar?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listarInsignias).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain('Carbono Neutral');
  });
});
