import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ImaTendenciaChartComponent, etiquetaMes } from './ima-tendencia-chart.component';
import { ImaEvento, ImaTendenciaPunto } from '../dashboard/ima.service';

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
    // El tercer dataset son los marcadores de eventos (PP-83), no una línea.
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

  describe('marcadores de eventos (PP-83)', () => {
    const eventos: ImaEvento[] = [
      {
        mes: '2026-06',
        tipo: 'CRUCE_SECTOR',
        texto: 'En junio 2026 tu IMA superó el promedio de tu sector.',
      },
    ];

    it('pinta un marcador en el mes del evento y ninguno en los demas', () => {
      componentRef.setInput('serie', serie);
      componentRef.setInput('eventos', eventos);
      fixture.detectChanges();

      const marcadores = chartData().datasets[2];
      expect(marcadores.label).toBe('Eventos');
      // serie = [2026-04, 2026-05, 2026-06] -> solo el ultimo tiene evento
      expect(marcadores.data).toEqual([null, null, 71]);
    });

    it('agrupa varios eventos del mismo mes en un unico marcador', () => {
      componentRef.setInput('serie', serie);
      componentRef.setInput('eventos', [
        ...eventos,
        { mes: '2026-06', tipo: 'MAYOR_VARIACION', texto: 'Mayor cambio de IMA (+3).' },
      ] satisfies ImaEvento[]);
      fixture.detectChanges();

      expect(chartData().datasets[2].data.filter((v) => v !== null)).toHaveLength(1);
    });

    it('no pinta marcadores cuando no hay eventos', () => {
      componentRef.setInput('serie', serie);
      fixture.detectChanges();

      expect(chartData().datasets[2].data).toEqual([null, null, null]);
    });

    it('coloca el marcador sobre la linea sectorial si la empresa no tiene dato ese mes', () => {
      componentRef.setInput('serie', serie);
      componentRef.setInput('eventos', [
        { mes: '2026-04', tipo: 'HUECO_DATOS', texto: 'No registraste emisiones.' },
      ] satisfies ImaEvento[]);
      fixture.detectChanges();

      // 2026-04 tiene imaEmpresa null y imaPromedioSector null -> queda null
      expect(chartData().datasets[2].data[0]).toBeNull();
    });
  });
});
