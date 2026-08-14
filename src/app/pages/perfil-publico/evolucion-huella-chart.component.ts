import { Component, computed, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  CategoryScale,
  Chart,
  ChartConfiguration,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { PuntoHuella } from './perfil-publico.models';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip
);

const FORMATO_TONELADAS = new Intl.NumberFormat('es-CR', {
  maximumFractionDigits: 2,
});

const FORMATO_PORCENTAJE = new Intl.NumberFormat('es-CR', {
  maximumFractionDigits: 1,
});

@Component({
  selector: 'app-evolucion-huella-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './evolucion-huella-chart.component.html',
  styleUrl: './evolucion-huella-chart.component.scss',
})
export class EvolucionHuellaChartComponent {
  readonly serie = input<PuntoHuella[]>([]);

  private readonly estilos = getComputedStyle(document.documentElement);
  private readonly colorPrincipal = this.estilos.getPropertyValue('--ch-green').trim() || '#1f8a5b';
  private readonly colorRelleno = `${this.colorPrincipal}1a`;

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => ({
    labels: this.serie().map((punto) => punto.periodo),
    datasets: [
      {
        data: this.serie().map((punto) => punto.huellaT),
        label: 'Huella verificada',
        borderColor: this.colorPrincipal,
        backgroundColor: this.colorRelleno,
        fill: true,
        tension: 0.32,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: this.colorPrincipal,
        pointBorderWidth: 2,
      },
    ],
  }));

  protected readonly arboles = computed(() => {
    const total = Math.max(this.serie().length, 1);
    return Array.from({ length: total }, (_, index) => index);
  });

  readonly chartOptions = computed<ChartConfiguration<'line'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => String(items[0]?.label ?? ''),
          label: (contexto) => `Huella: ${this.formatoToneladas(Number(contexto.parsed.y))} t CO2e`,
          afterLabel: (contexto) => {
            const punto = this.serie()[contexto.dataIndex];
            if (!punto || punto.variacionPorcentual === null) {
              return 'Sin variacion frente al periodo anterior';
            }
            return `Variacion: ${FORMATO_PORCENTAJE.format(
              punto.variacionPorcentual
            )}% vs periodo anterior`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          callback: (value) => `${this.formatoToneladas(Number(value))} t`,
        },
      },
    },
  }));

  private formatoToneladas(valor: number): string {
    return FORMATO_TONELADAS.format(valor);
  }
}
