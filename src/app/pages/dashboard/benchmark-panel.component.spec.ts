import { TestBed } from '@angular/core/testing';
import { BenchmarkPanelComponent } from './benchmark-panel.component';
import { BenchmarkSectorialResponse } from './ima.service';

describe('BenchmarkPanelComponent', () => {
  const benchmarkCompleto: BenchmarkSectorialResponse = {
    benchmarkDisponible: true,
    cantidadEmpresas: 8,
    imaParcial: false,
    ima: { valorEmpresa: 71, promedioSector: 64, posicion: 'POR_ENCIMA' },
    cobertura: { valorEmpresa: 75, promedioSector: 70, posicion: 'POR_ENCIMA' },
    puntajeIntensidadSectorial: { valorEmpresa: 58, promedioSector: 66, posicion: 'POR_DEBAJO' },
    consistencia: { valorEmpresa: 63, promedioSector: 62, posicion: 'EN_LINEA' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenchmarkPanelComponent],
    }).compileComponents();
  });

  function crear(benchmark: BenchmarkSectorialResponse | null) {
    const fixture = TestBed.createComponent(BenchmarkPanelComponent);
    fixture.componentRef.setInput('benchmark', benchmark);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra las cuatro dimensiones con su promedio y cantidad de empresas', () => {
    const fixture = crear(benchmarkCompleto);
    const html = fixture.nativeElement as HTMLElement;

    expect(html.textContent).toContain('8 empresas');
    expect(html.querySelectorAll('.benchmark-dim')).toHaveLength(4);
    expect(html.textContent).toContain('IMA global');
    expect(html.textContent).toContain('Cobertura');
    expect(html.textContent).toContain('Intensidad sectorial');
    expect(html.textContent).toContain('Consistencia');
  });

  it('pinta el badge con la variante y el delta segun la posicion', () => {
    const fixture = crear(benchmarkCompleto);
    const badges = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('app-badge'));

    expect(badges[0].className).toContain('ch-badge--success');
    expect(badges[0].textContent).toContain('Por encima');
    expect(badges[0].textContent).toContain('+7');
    expect(badges[2].className).toContain('ch-badge--danger');
    expect(badges[2].textContent).toContain('-8');
    expect(badges[3].className).toContain('ch-badge--info');
    expect(badges[3].textContent).toContain('En línea');
  });

  it('con benchmarkDisponible en false muestra el aviso de umbral y ninguna dimension', () => {
    const fixture = crear({
      benchmarkDisponible: false,
      cantidadEmpresas: 4,
      imaParcial: false,
      ima: null,
      cobertura: null,
      puntajeIntensidadSectorial: null,
      consistencia: null,
    });
    const html = fixture.nativeElement as HTMLElement;

    expect(html.textContent).toContain(
      'Tu sector aún no tiene suficientes empresas (mínimo 5) para mostrar el benchmark.'
    );
    expect(html.querySelectorAll('.benchmark-dim')).toHaveLength(0);
  });

  it('con IMA parcial muestra el puntaje de intensidad como no disponible', () => {
    const fixture = crear({
      ...benchmarkCompleto,
      imaParcial: true,
      puntajeIntensidadSectorial: { valorEmpresa: null, promedioSector: 66, posicion: null },
    });
    const html = fixture.nativeElement as HTMLElement;
    const naBadge = Array.from(html.querySelectorAll('app-badge')).find((b) =>
      b.textContent?.includes('No disponible')
    );

    expect(naBadge?.className).toContain('ch-badge--neutral');
    expect(html.querySelectorAll('.benchmark-dim__bar')).toHaveLength(3);
    expect(html.querySelector('.benchmark-radar')).toBeNull();
  });

  it('sin datos muestra el estado de carga', () => {
    const fixture = crear(null);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Cargando benchmark sectorial...'
    );
  });

  it('con error muestra el mensaje y no el estado de carga', () => {
    const fixture = TestBed.createComponent(BenchmarkPanelComponent);
    fixture.componentRef.setInput('benchmark', null);
    fixture.componentRef.setInput('error', true);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar el benchmark sectorial'
    );
    expect(html.textContent).not.toContain('Cargando benchmark sectorial...');
  });
});
