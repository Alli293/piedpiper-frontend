import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ImaTendenciaChartComponent, etiquetaMes } from './ima-tendencia-chart.component';
import { ImaTendenciaPunto } from '../dashboard/ima.service';

interface ChartDataAccesible {
  labels: string[];
  datasets: { label: string; data: (number | null)[] }[];
}

describe('ImaTendenciaChartComponent', () => {
  let fixture: ComponentFixture<ImaTendenciaChartComponent>;
  let componentRef: ComponentRef<ImaTendenciaChartComponent>;

  const serie: ImaTendenciaPunto[] = [
    { mes: '2026-04', imaEmpresa: null, imaPromedioSector: null },
    { mes: '2026-05', imaEmpresa: 68, imaPromedioSector: 63.5 },
    { mes: '2026-06', imaEmpresa: 71, imaPromedioSector: null },
  ];

  const chartData = (): ChartDataAccesible =>
    fixture.componentInstance.chartData() as ChartDataAccesible;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImaTendenciaChartComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ImaTendenciaChartComponent);
    componentRef = fixture.componentRef;
  });

  it('transforma la serie en dos lineas: empresa y promedio sectorial', () => {
    componentRef.setInput('serie', serie);
    fixture.detectChanges();

    const data = chartData();
    expect(data.datasets).toHaveLength(2);
    expect(data.datasets[0].label).toBe('Tu empresa');
    expect(data.datasets[1].label).toBe('Promedio del sector');
    expect(data.datasets[0].data).toEqual([null, 68, 71]);
    expect(data.datasets[1].data).toEqual([null, 63.5, null]);
  });

  it('usa etiquetas de mes abreviadas en el eje X', () => {
    componentRef.setInput('serie', serie);
    fixture.detectChanges();

    expect(chartData().labels).toEqual(['Abr', 'May', 'Jun']);
  });

  it('maneja el caso sin linea sectorial dejando la serie del sector en nulos', () => {
    componentRef.setInput('serie', [
      { mes: '2026-05', imaEmpresa: 68, imaPromedioSector: null },
      { mes: '2026-06', imaEmpresa: 71, imaPromedioSector: null },
    ] satisfies ImaTendenciaPunto[]);
    fixture.detectChanges();

    const data = chartData();
    expect(data.datasets[1].data).toEqual([null, null]);
    expect(data.datasets[0].data).toEqual([68, 71]);
  });

  it('no rellena con ceros los meses sin dato de la empresa', () => {
    componentRef.setInput('serie', serie);
    fixture.detectChanges();

    expect(chartData().datasets[0].data).not.toContain(0);
  });

  it('devuelve una serie vacia cuando no hay puntos', () => {
    fixture.detectChanges();

    const data = chartData();
    expect(data.labels).toEqual([]);
    expect(data.datasets[0].data).toEqual([]);
  });

  it('etiquetaMes convierte el periodo ISO en el mes abreviado', () => {
    expect(etiquetaMes('2026-01')).toBe('Ene');
    expect(etiquetaMes('2026-12')).toBe('Dic');
  });
});
