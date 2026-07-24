import { Component, computed, input } from '@angular/core';
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
  PointElement,
  Tooltip,
} from 'chart.js';
import { ImaEvento, ImaTendenciaPunto } from '../dashboard/ima.service';

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

/** Convierte un período ISO `YYYY-MM` en la etiqueta corta del eje X. */
export function etiquetaMes(periodo: string): string {
  const mes = Number(periodo.slice(5, 7));
  return MESES_CORTOS[mes - 1] ?? periodo;
}

@Component({
  selector: 'app-ima-tendencia-chart',
  imports: [BaseChartDirective],
  templateUrl: './ima-tendencia-chart.component.html',
  styleUrl: './ima-tendencia-chart.component.scss',
})
export class ImaTendenciaChartComponent {
  readonly serie = input<ImaTendenciaPunto[]>([]);
  readonly eventos = input<ImaEvento[]>([]);

  private readonly estilos = getComputedStyle(document.documentElement);

  private readonly colorEmpresa = this.estilos.getPropertyValue('--ch-green').trim() || '#1f8a5b';
  private readonly colorSector =
    this.estilos.getPropertyValue('--ch-text-secondary').trim() || '#64748b';
  private readonly colorEvento = this.estilos.getPropertyValue('--ch-blue-mid').trim() || '#2ba6de';

  /** Eventos agrupados por mes: en un mismo mes puede coincidir más de uno. */
  protected readonly eventosPorMes = computed(() => {
    const agrupados = new Map<string, ImaEvento[]>();
    for (const evento of this.eventos()) {
      const existentes = agrupados.get(evento.mes);
      if (existentes) {
        existentes.push(evento);
      } else {
        agrupados.set(evento.mes, [evento]);
      }
    }
    return agrupados;
  });

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const puntos = this.serie();
    const porMes = this.eventosPorMes();

    return {
      labels: puntos.map((punto) => etiquetaMes(punto.mes)),
      datasets: [
        {
          data: puntos.map((punto) => punto.imaEmpresa),
          label: 'Tu empresa',
          borderColor: this.colorEmpresa,
          backgroundColor: `${this.colorEmpresa}1a`,
          pointBackgroundColor: this.colorEmpresa,
          fill: false,
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
        {
          // Serie solo de marcadores: un punto en los meses con evento.
          data: puntos.map((punto) =>
            porMes.has(punto.mes) ? (punto.imaEmpresa ?? punto.imaPromedioSector) : null
          ),
          label: 'Eventos',
          borderColor: 'transparent',
          backgroundColor: this.colorEvento,
          pointBackgroundColor: this.colorEvento,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 7,
          pointHoverRadius: 9,
          pointStyle: 'circle',
          showLine: false,
          fill: false,
          spanGaps: false,
          order: -1,
        },
      ],
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'line'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'start',
        // La serie de marcadores no es una línea real; se oculta de la leyenda.
        labels: { filter: (item) => item.text !== 'Eventos' },
      },
      tooltip: {
        callbacks: {
          label: (contexto) => {
            const punto = this.serie()[contexto.dataIndex];
            if (contexto.dataset.label === 'Eventos') {
              return (
                this.eventosPorMes()
                  .get(punto?.mes ?? '')
                  ?.map((evento) => evento.texto) ?? []
              );
            }
            return `${contexto.dataset.label}: ${Number(contexto.parsed.y).toFixed(1)} / 100`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { min: 0, max: 100, ticks: { stepSize: 20 } },
    },
  }));
}
