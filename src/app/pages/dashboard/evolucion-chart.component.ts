import { Component, computed, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js';
import { PuntoMensual } from './evolucion.service';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip
);

@Component({
  selector: 'app-evolucion-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './evolucion-chart.component.html',
  styleUrl: './evolucion-chart.component.scss',
})
export class EvolucionChartComponent {
  readonly serie = input<PuntoMensual[]>([]);
  readonly anio = input(new Date().getFullYear());

  private readonly meses = [
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

  private readonly colorPrincipal =
    getComputedStyle(document.documentElement).getPropertyValue('--ch-green').trim() || '#1f8a5b';

  readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const datos = this.serie().map((p) => p.totalCarbonKg);
    return {
      labels: this.meses,
      datasets: [
        {
          data: datos,
          label: `Huella ${this.anio()} (kg CO₂e)`,
          borderColor: this.colorPrincipal,
          backgroundColor: `${this.colorPrincipal}1a`,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: this.colorPrincipal,
        },
      ],
    };
  });

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { callback: (value) => `${value} kg` } },
    },
  };
}
