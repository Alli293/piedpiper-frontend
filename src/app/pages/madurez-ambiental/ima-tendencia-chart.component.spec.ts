import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import {
  encabezadoMes,
  etiquetaMes,
  ImaTendenciaChartComponent,
  MarcadorEvento,
} from './ima-tendencia-chart.component';
import { ImaEvento, ImaTendenciaPunto } from '../dashboard/ima.service';

describe('ImaTendenciaChartComponent', () => {
  let fixture: ComponentFixture<ImaTendenciaChartComponent>;
  let componentRef: ComponentRef<ImaTendenciaChartComponent>;

  const serie: ImaTendenciaPunto[] = [
    { mes: '2026-04', imaEmpresa: null, imaPromedioSector: null },
    { mes: '2026-05', imaEmpresa: 68, imaPromedioSector: 63.5 },
    { mes: '2026-06', imaEmpresa: 71, imaPromedioSector: null },
  ];

  const chartData = () => fixture.componentInstance.chartData();
  const marcadores = (): MarcadorEvento[] => fixture.componentInstance.marcadores();

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

  it('encabezadoMes arma el titulo del tooltip en mayusculas', () => {
    expect(encabezadoMes('2026-05')).toBe('MAYO 2026');
  });

  describe('marcadores de eventos (PP-83)', () => {
    const eventos: ImaEvento[] = [
      {
        mes: '2026-06',
        tipo: 'CRUCE_SECTOR',
        texto: 'En junio 2026 tu IMA superó el promedio de tu sector.',
      },
    ];

    it('crea un marcador en el indice del mes con evento', () => {
      componentRef.setInput('serie', serie);
      componentRef.setInput('eventos', eventos);
      fixture.detectChanges();

      expect(marcadores()).toHaveLength(1);
      expect(marcadores()[0].indice).toBe(2);
      expect(marcadores()[0].mes).toBe('2026-06');
    });

    it('numera los marcadores en orden cronologico', () => {
      componentRef.setInput('serie', serie);
      componentRef.setInput('eventos', [
        { mes: '2026-06', tipo: 'CRUCE_SECTOR', texto: 'Segundo.' },
        { mes: '2026-05', tipo: 'HUECO_DATOS', texto: 'Primero.' },
      ] satisfies ImaEvento[]);
      fixture.detectChanges();

      expect(marcadores().map((m) => m.numero)).toEqual([1, 2]);
      expect(marcadores()[0].mes).toBe('2026-05');
      expect(marcadores()[1].mes).toBe('2026-06');
    });

    it('agrupa varios eventos del mismo mes en un unico marcador', () => {
      componentRef.setInput('serie', serie);
      componentRef.setInput('eventos', [
        ...eventos,
        { mes: '2026-06', tipo: 'MAYOR_VARIACION', texto: 'Mayor cambio de IMA (+3).' },
      ] satisfies ImaEvento[]);
      fixture.detectChanges();

      expect(marcadores()).toHaveLength(1);
      expect(marcadores()[0].textos).toEqual([
        'En junio 2026 tu IMA superó el promedio de tu sector.',
        'Mayor cambio de IMA (+3).',
      ]);
    });

    it('expone el encabezado del mes para el tooltip', () => {
      componentRef.setInput('serie', serie);
      componentRef.setInput('eventos', eventos);
      fixture.detectChanges();

      expect(marcadores()[0].encabezado).toBe('JUNIO 2026');
    });

    it('no crea marcadores cuando no hay eventos', () => {
      componentRef.setInput('serie', serie);
      fixture.detectChanges();

      expect(marcadores()).toEqual([]);
    });

    it('ignora eventos de meses que no estan en la serie', () => {
      componentRef.setInput('serie', serie);
      componentRef.setInput('eventos', [
        { mes: '2025-01', tipo: 'HUECO_DATOS', texto: 'Fuera de la ventana.' },
      ] satisfies ImaEvento[]);
      fixture.detectChanges();

      expect(marcadores()).toEqual([]);
    });

    it('centra el tooltip dentro de un contenedor angosto', () => {
      fixture.detectChanges();
      const contenedor = (fixture.nativeElement as HTMLElement).querySelector(
        '.ch-ima-tendencia__grafico'
      ) as HTMLElement;
      Object.defineProperty(contenedor, 'clientWidth', { configurable: true, value: 240 });

      const estilo = (fixture.componentInstance as any).estiloTooltip({
        numero: 1,
        x: 220,
        yTop: 20,
      });

      expect(estilo.left).toBe('120px');
    });

    it('no produce error al cambiar de una ventana con eventos a otra sin eventos', () => {
      // Primero: ventana con eventos
      componentRef.setInput('serie', serie);
      componentRef.setInput('eventos', [
        { mes: '2026-06', tipo: 'CRUCE_SECTOR', texto: 'Evento de junio.' },
      ] satisfies ImaEvento[]);
      fixture.detectChanges();

      expect(marcadores()).toHaveLength(1);

      // Simular que el plugin publicó posiciones para esa ventana
      (fixture.componentInstance as any).posicionesRaw.set([{ numero: 1, x: 100, yTop: 20 }]);

      // Ahora: cambiar a una ventana sin eventos (marcadores se vacía)
      componentRef.setInput('serie', [
        { mes: '2025-01', imaEmpresa: 50, imaPromedioSector: 45 },
        { mes: '2025-02', imaEmpresa: 55, imaPromedioSector: 46 },
      ] satisfies ImaTendenciaPunto[]);
      componentRef.setInput('eventos', []);

      // Las posiciones viejas deben filtrarse por el computed — no debería haber marcadores visibles
      expect(marcadores()).toEqual([]);
      // posiciones computed filtra los valores viejos que ya no corresponden a marcadores válidos
      expect((fixture.componentInstance as any).posiciones()).toEqual([]);
    });
  });
});
