import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BenchmarkDimension, BenchmarkSectorialResponse, PosicionBenchmark } from './ima.service';

interface FilaBenchmark {
  clave: string;
  etiqueta: string;
  colorClass: string;
  dimension: BenchmarkDimension;
}

interface PosicionVisual {
  etiqueta: string;
  chipClass: string;
  delta: string;
}

const POSICIONES: Record<
  PosicionBenchmark,
  { etiqueta: string; chipClass: string; flecha: string }
> = {
  POR_ENCIMA: { etiqueta: 'Por encima', chipClass: 'benchmark-chip--encima', flecha: '↗' },
  EN_LINEA: { etiqueta: 'En línea', chipClass: 'benchmark-chip--linea', flecha: '→' },
  POR_DEBAJO: { etiqueta: 'Por debajo', chipClass: 'benchmark-chip--debajo', flecha: '↘' },
};

const RADAR_CENTRO = 100;
const RADAR_RADIO = 80;

@Component({
  selector: 'app-benchmark-panel',
  imports: [DecimalPipe],
  templateUrl: './benchmark-panel.component.html',
  styleUrl: './benchmark-panel.component.scss',
})
export class BenchmarkPanelComponent {
  readonly benchmark = input<BenchmarkSectorialResponse | null>(null);

  protected readonly filas = computed<FilaBenchmark[]>(() => {
    const data = this.benchmark();
    if (!data || !data.benchmarkDisponible) {
      return [];
    }
    return [
      { clave: 'ima', etiqueta: 'IMA global', colorClass: 'ima', dimension: data.ima! },
      {
        clave: 'cobertura',
        etiqueta: 'Cobertura',
        colorClass: 'cobertura',
        dimension: data.cobertura!,
      },
      {
        clave: 'puntajeIntensidadSectorial',
        etiqueta: 'Intensidad sectorial',
        colorClass: 'intensidad',
        dimension: data.puntajeIntensidadSectorial!,
      },
      {
        clave: 'consistencia',
        etiqueta: 'Consistencia',
        colorClass: 'consistencia',
        dimension: data.consistencia!,
      },
    ];
  });

  protected readonly puntosEmpresa = computed(() =>
    this.puntosRadar((dimension) => dimension.valorEmpresa)
  );

  protected readonly puntosPromedio = computed(() =>
    this.puntosRadar((dimension) => dimension.promedioSector)
  );

  protected posicionVisual(dimension: BenchmarkDimension): PosicionVisual | null {
    if (
      dimension.posicion === null ||
      dimension.valorEmpresa === null ||
      dimension.promedioSector === null
    ) {
      return null;
    }
    const config = POSICIONES[dimension.posicion];
    const diferencia = Math.round(dimension.valorEmpresa - dimension.promedioSector);
    const signo = diferencia > 0 ? '+' : '';
    return {
      etiqueta: `${config.flecha} ${config.etiqueta} · ${signo}${diferencia}`,
      chipClass: config.chipClass,
      delta: `${signo}${diferencia}`,
    };
  }

  private puntosRadar(valor: (dimension: BenchmarkDimension) => number | null): string {
    const data = this.benchmark();
    if (!data || !data.benchmarkDisponible) {
      return '';
    }
    const arriba = valor(data.ima!) ?? 0;
    const derecha = valor(data.cobertura!) ?? 0;
    const abajo = valor(data.consistencia!) ?? 0;
    const izquierda = valor(data.puntajeIntensidadSectorial!) ?? 0;

    const punto = (magnitud: number, dx: number, dy: number): string => {
      const escala = (Math.min(Math.max(magnitud, 0), 100) / 100) * RADAR_RADIO;
      return `${RADAR_CENTRO + dx * escala},${RADAR_CENTRO + dy * escala}`;
    };

    return [
      punto(arriba, 0, -1),
      punto(derecha, 1, 0),
      punto(abajo, 0, 1),
      punto(izquierda, -1, 0),
    ].join(' ');
  }
}
