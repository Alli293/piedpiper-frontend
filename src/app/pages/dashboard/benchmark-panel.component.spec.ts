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

  it('pinta el chip con la clase y el delta segun la posicion', () => {
    const fixture = crear(benchmarkCompleto);
    const chips = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.benchmark-chip')
    );

    expect(chips[0].className).toContain('benchmark-chip--encima');
    expect(chips[0].textContent).toContain('Por encima');
    expect(chips[0].textContent).toContain('+7');
    expect(chips[2].className).toContain('benchmark-chip--debajo');
    expect(chips[2].textContent).toContain('-8');
    expect(chips[3].className).toContain('benchmark-chip--linea');
    expect(chips[3].textContent).toContain('En línea');
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

    expect(html.querySelector('.benchmark-chip--na')?.textContent).toContain('No disponible');
    expect(html.querySelectorAll('.benchmark-dim__bar')).toHaveLength(3);
  });

  it('sin datos muestra el estado de carga', () => {
    const fixture = crear(null);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Cargando benchmark sectorial...'
    );
  });
});
