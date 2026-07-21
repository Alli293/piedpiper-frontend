import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { BenchmarkDimension, BenchmarkSectorialResponse, PosicionBenchmark } from './ima.service';

type ColorDimension = 'ima' | 'cobertura' | 'intensidad' | 'consistencia';

interface PosicionVisual {
  variant: BadgeVariant;
  etiqueta: string;
}

interface FilaBenchmark {
  clave: string;
  etiqueta: string;
  color: ColorDimension;
  valorEmpresa: number | null;
  promedioSector: number | null;
  barraWidth: number | null;
  marcaLeft: number | null;
  promedioAria: string;
  posicion: PosicionVisual;
}

const POSICIONES: Record<
  PosicionBenchmark,
  { variant: BadgeVariant; etiqueta: string; flecha: string }
> = {
  POR_ENCIMA: { variant: 'success', etiqueta: 'Por encima', flecha: '↗' },
  EN_LINEA: { variant: 'info', etiqueta: 'En línea', flecha: '→' },
  POR_DEBAJO: { variant: 'danger', etiqueta: 'Por debajo', flecha: '↘' },
};

const NO_DISPONIBLE: PosicionVisual = { variant: 'neutral', etiqueta: 'No disponible' };

const RADAR_CENTRO = 100;
const RADAR_RADIO = 80;

function acotar(valor: number): number {
  return Math.min(Math.max(valor, 0), 100);
}

@Component({
  selector: 'app-benchmark-panel',
  imports: [DecimalPipe, BadgeComponent],
  templateUrl: './benchmark-panel.component.html',
  styleUrl: './benchmark-panel.component.scss',
})
export class BenchmarkPanelComponent {
  readonly benchmark = input<BenchmarkSectorialResponse | null>(null);
  readonly error = input(false);

  protected readonly filas = computed<FilaBenchmark[]>(() => {
    const data = this.benchmark();
    if (!data || !data.benchmarkDisponible) {
      return [];
    }
    return [
      this.fila('ima', 'IMA global', 'ima', data.ima),
      this.fila('cobertura', 'Cobertura', 'cobertura', data.cobertura),
      this.fila(
        'puntajeIntensidadSectorial',
        'Intensidad sectorial',
        'intensidad',
        data.puntajeIntensidadSectorial
      ),
      this.fila('consistencia', 'Consistencia', 'consistencia', data.consistencia),
    ];
  });

  protected readonly radarDisponible = computed(() => {
    const data = this.benchmark();
    return (
      !!data && data.benchmarkDisponible && data.puntajeIntensidadSectorial.valorEmpresa !== null
    );
  });

  protected readonly puntosEmpresa = computed(() => this.puntosRadar((d) => d.valorEmpresa));
  protected readonly puntosPromedio = computed(() => this.puntosRadar((d) => d.promedioSector));

  private fila(
    clave: string,
    etiqueta: string,
    color: ColorDimension,
    dimension: BenchmarkDimension
  ): FilaBenchmark {
    return {
      clave,
      etiqueta,
      color,
      valorEmpresa: dimension.valorEmpresa,
      promedioSector: dimension.promedioSector,
      barraWidth: dimension.valorEmpresa === null ? null : acotar(dimension.valorEmpresa),
      marcaLeft: dimension.promedioSector === null ? null : acotar(dimension.promedioSector),
      promedioAria:
        dimension.promedioSector === null
          ? ''
          : `Promedio del sector: ${Math.round(dimension.promedioSector)}`,
      posicion: this.posicionVisual(dimension),
    };
  }

  private posicionVisual(dimension: BenchmarkDimension): PosicionVisual {
    if (
      dimension.posicion === null ||
      dimension.valorEmpresa === null ||
      dimension.promedioSector === null
    ) {
      return NO_DISPONIBLE;
    }
    const config = POSICIONES[dimension.posicion];
    const diferencia = Math.round(dimension.valorEmpresa - dimension.promedioSector);
    const signo = diferencia > 0 ? '+' : '';
    return {
      variant: config.variant,
      etiqueta: `${config.flecha} ${config.etiqueta} · ${signo}${diferencia}`,
    };
  }

  private puntosRadar(valor: (dimension: BenchmarkDimension) => number | null): string {
    const data = this.benchmark();
    if (!data || !data.benchmarkDisponible) {
      return '';
    }
    const punto = (magnitud: number | null, dx: number, dy: number): string => {
      const escala = (acotar(magnitud ?? 0) / 100) * RADAR_RADIO;
      return `${RADAR_CENTRO + dx * escala},${RADAR_CENTRO + dy * escala}`;
    };
    return [
      punto(valor(data.ima), 0, -1),
      punto(valor(data.cobertura), 1, 0),
      punto(valor(data.consistencia), 0, 1),
      punto(valor(data.puntajeIntensidadSectorial), -1, 0),
    ].join(' ');
  }
}
