import { Component, computed, ElementRef, input, signal, viewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  CategoryScale,
  Chart,
  ChartConfiguration,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  Plugin,
  PointElement,
  Tooltip,
} from 'chart.js';
import { ImaEvento, ImaTendenciaPunto, TipoEventoIma } from '../dashboard/ima.service';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip
);

const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const MESES_LARGOS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

/** Convierte un período ISO `YYYY-MM` en la etiqueta corta del eje X. */
export function etiquetaMes(periodo: string): string {
  const mes = Number(periodo.slice(5, 7));
  return MESES_CORTOS[mes - 1] ?? periodo;
}

/** Convierte un período ISO `YYYY-MM` en el encabezado del tooltip, p. ej. `MAYO 2026`. */
export function encabezadoMes(periodo: string): string {
  const mes = Number(periodo.slice(5, 7));
  const anio = periodo.slice(0, 4);
  return `${MESES_LARGOS[mes - 1] ?? periodo} ${anio}`;
}

/** Marcador numerado que se dibuja sobre el eje superior del gráfico. */
export interface MarcadorEvento {
  readonly indice: number;
  readonly numero: number;
  readonly mes: string;
  readonly encabezado: string;
  readonly textos: readonly string[];
  readonly tipo: TipoEventoIma;
}

/** Posición en píxeles de un marcador dentro del canvas. */
interface PosicionMarcador {
  readonly numero: number;
  readonly x: number;
  readonly yTop: number;
}

const RADIO_MARCADOR = 13;

@Component({
  selector: 'app-ima-tendencia-chart',
  imports: [BaseChartDirective],
  templateUrl: './ima-tendencia-chart.component.html',
  styleUrl: './ima-tendencia-chart.component.scss',
})
export class ImaTendenciaChartComponent {
  readonly serie = input<ImaTendenciaPunto[]>([]);
  readonly eventos = input<ImaEvento[]>([]);

  private readonly contenedor = viewChild<ElementRef<HTMLElement>>('contenedor');

  private readonly estilos = getComputedStyle(document.documentElement);

  private readonly colorEmpresa = this.estilos.getPropertyValue('--ch-green').trim() || '#1f8a5b';
  private readonly colorSector =
    this.estilos.getPropertyValue('--ch-text-secondary').trim() || '#64748b';
  private readonly colorEvento = this.estilos.getPropertyValue('--ch-blue-mid').trim() || '#2ba6de';
  private readonly colorEventoAlt = this.estilos.getPropertyValue('--ch-green').trim() || '#1f8a5b';

  /** Posiciones calculadas por el plugin en cada repintado. */
  protected readonly posiciones = signal<PosicionMarcador[]>([]);

  /** Número del marcador cuyo tooltip está abierto; null si ninguno. */
  protected readonly marcadorActivo = signal<number | null>(null);

  /**
   * Un marcador por mes con eventos, numerado en orden cronológico.
   * Si en un mes coinciden varios eventos, comparten marcador y el tooltip
   * lista todos los textos.
   */
  readonly marcadores = computed<MarcadorEvento[]>(() => {
    const puntos = this.serie();
    const agrupados = new Map<string, ImaEvento[]>();
    for (const evento of this.eventos()) {
      const existentes = agrupados.get(evento.mes);
      if (existentes) {
        existentes.push(evento);
      } else {
        agrupados.set(evento.mes, [evento]);
      }
    }

    const marcadores: MarcadorEvento[] = [];
    puntos.forEach((punto, indice) => {
      const eventosDelMes = agrupados.get(punto.mes);
      if (eventosDelMes?.length) {
        marcadores.push({
          indice,
          numero: marcadores.length + 1,
          mes: punto.mes,
          encabezado: encabezadoMes(punto.mes),
          textos: eventosDelMes.map((evento) => evento.texto),
          tipo: eventosDelMes[0].tipo,
        });
      }
    });
    return marcadores;
  });

  protected readonly hayMarcadores = computed(() => this.marcadores().length > 0);

  /** Datos del tooltip abierto, o null si no hay ninguno. */
  protected readonly tooltipAbierto = computed(() => {
    const numero = this.marcadorActivo();
    if (numero === null) return null;

    const marcador = this.marcadores().find((m) => m.numero === numero);
    const posicion = this.posiciones().find((p) => p.numero === numero);
    if (!marcador || !posicion) return null;

    return { marcador, posicion };
  });

  protected color(tipo: TipoEventoIma): string {
    // Se alternan dos colores para distinguir los tipos, como en el diseño.
    return tipo === 'NUEVA_CATEGORIA' ? this.colorEventoAlt : this.colorEvento;
  }

  /**
   * Dibuja una línea vertical punteada por cada marcador y publica sus posiciones
   * para colocar los círculos numerados como elementos HTML sobre el canvas.
   */
  private readonly pluginMarcadores: Plugin<'line'> = {
    id: 'marcadoresEventos',
    afterDatasetsDraw: (chart) => {
      const marcadores = this.marcadores();
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales['x']) return;

      const posiciones: PosicionMarcador[] = [];

      ctx.save();
      for (const marcador of marcadores) {
        const x = scales['x'].getPixelForValue(marcador.indice);

        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = this.color(marcador.tipo);
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.5;
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();

        posiciones.push({ numero: marcador.numero, x, yTop: chartArea.top });
      }
      ctx.restore();

      // Se publica fuera del ciclo de dibujo para no disparar un repintado inmediato.
      queueMicrotask(() => this.posiciones.set(posiciones));
    },
  };

  protected readonly chartPlugins = [this.pluginMarcadores];

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const puntos = this.serie();

    return {
      labels: puntos.map((punto) => etiquetaMes(punto.mes)),
      datasets: [
        {
          data: puntos.map((punto) => punto.imaEmpresa),
          label: 'Tu empresa',
          borderColor: this.colorEmpresa,
          backgroundColor: `${this.colorEmpresa}1a`,
          pointBackgroundColor: this.colorEmpresa,
          fill: true,
          tension: 0.3,
          // Corta la línea en los meses sin snapshot en lugar de interpolar.
          spanGaps: false,
        },
        {
          data: puntos.map((punto) => punto.imaPromedioSector),
          label: 'Promedio del sector',
          borderColor: this.colorSector,
          backgroundColor: 'transparent',
          pointBackgroundColor: this.colorSector,
          borderDash: [6, 4],
          fill: false,
          tension: 0,
          spanGaps: false,
        },
      ],
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'line'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      // Espacio superior para los marcadores numerados.
      padding: { top: RADIO_MARCADOR + 6 },
    },
    plugins: {
      legend: { display: true, position: 'top', align: 'start' },
      tooltip: {
        callbacks: {
          label: (contexto) =>
            `${contexto.dataset.label}: ${Number(contexto.parsed.y).toFixed(1)} / 100`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { min: 0, max: 100, ticks: { stepSize: 20 } },
    },
  }));

  protected abrir(numero: number): void {
    this.marcadorActivo.set(numero);
  }

  protected cerrar(): void {
    this.marcadorActivo.set(null);
  }

  /** Posición del círculo numerado, centrado sobre el eje superior. */
  protected estiloMarcador(posicion: PosicionMarcador): Record<string, string> {
    return {
      left: `${posicion.x - RADIO_MARCADOR}px`,
      top: `${posicion.yTop - RADIO_MARCADOR}px`,
    };
  }

  /** Posición del globo: anclado al marcador y contenido dentro del gráfico. */
  protected estiloTooltip(posicion: PosicionMarcador): Record<string, string> {
    const ancho = this.contenedor()?.nativeElement.clientWidth ?? 0;
    // Se mantiene el globo dentro del contenedor cuando el marcador está en un borde.
    const izquierda =
      ancho > 0 ? Math.min(Math.max(posicion.x, 150), Math.max(ancho - 150, 150)) : posicion.x;
    return {
      left: `${izquierda}px`,
      top: `${posicion.yTop + RADIO_MARCADOR + 8}px`,
    };
  }
}
