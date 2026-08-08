import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PerfilPublicoDTO } from '../perfil-publico.models';
import { PerfilPublicoSeccionHeaderComponent } from './perfil-publico-seccion-header.component';

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

describe('PerfilPublicoSeccionHeaderComponent', () => {
  async function crear(inputs: {
    perfil?: PerfilPublicoDTO | null;
    mostrarResumen?: boolean;
  }): Promise<ComponentFixture<PerfilPublicoSeccionHeaderComponent>> {
    await TestBed.configureTestingModule({
      imports: [PerfilPublicoSeccionHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PerfilPublicoSeccionHeaderComponent);
    fixture.componentRef.setInput('slug', 'cafe-del-valle');
    fixture.componentRef.setInput('seccionLabel', 'Insignias activas');
    fixture.componentRef.setInput('titulo', 'Insignias activas');
    fixture.componentRef.setInput('subtitulo', 'Reconocimientos vigentes.');
    fixture.componentRef.setInput('conteo', 6);
    fixture.componentRef.setInput('conteoLabel', 'Insignias activas');
    if ('perfil' in inputs) {
      fixture.componentRef.setInput('perfil', inputs.perfil);
    }
    if ('mostrarResumen' in inputs) {
      fixture.componentRef.setInput('mostrarResumen', inputs.mostrarResumen);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('con perfil cargado, muestra el nombre de la empresa en el breadcrumb y el titulo', async () => {
    const fixture = await crear({ perfil: PERFIL });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-pp-header__crumb-link')?.textContent?.trim()).toBe(
      'Café del Valle S.A.'
    );
    expect(root.textContent).toContain('Insignias activas de Café del Valle S.A.');
  });

  it('sin perfil (null), cae a la variante generica sin romper el render', async () => {
    const fixture = await crear({ perfil: null });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-pp-header__crumb-link')?.textContent?.trim()).toBe(
      'Perfil público'
    );
    expect(root.textContent).toContain('Insignias activas');
    expect(root.textContent).not.toContain('de undefined');
  });

  it('mostrarResumen=false oculta la tarjeta de resumen pero conserva el breadcrumb', async () => {
    const fixture = await crear({ perfil: PERFIL, mostrarResumen: false });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-pp-header__crumb-link')?.textContent?.trim()).toBe(
      'Café del Valle S.A.'
    );
    expect(root.querySelector('.ch-pp-header__card')).toBeNull();
  });

  it('el enlace del breadcrumb apunta al hub del perfil publico', async () => {
    const fixture = await crear({ perfil: PERFIL });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-pp-header__crumb-link')?.getAttribute('href')).toBe(
      '/empresa/cafe-del-valle/reputacion'
    );
  });

  it('emite volver al hacer click en el boton de volver', async () => {
    const fixture = await crear({ perfil: PERFIL });
    const emitido = vi.fn();
    fixture.componentInstance.volver.subscribe(emitido);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.ch-pp-header__volver')
      ?.click();

    expect(emitido).toHaveBeenCalled();
  });
});
