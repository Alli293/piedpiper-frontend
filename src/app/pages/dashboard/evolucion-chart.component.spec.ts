import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { EvolucionChartComponent } from './evolucion-chart.component';
import { PuntoMensual } from './evolucion.service';

describe('EvolucionChartComponent', () => {
  let component: EvolucionChartComponent;
  let componentRef: ComponentRef<EvolucionChartComponent>;
  let fixture: ComponentFixture<EvolucionChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvolucionChartComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EvolucionChartComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('inicializa con 12 puntos vacios', () => {
    componentRef.setInput(
      'serie',
      Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, totalCarbonKg: 0 }))
    );
    fixture.detectChanges();
    expect(component.chartData.datasets[0].data).toHaveLength(12);
  });

  it('transforma la serie en datos del grafico', () => {
    const serie: PuntoMensual[] = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      totalCarbonKg: i < 3 ? 500 : 0,
    }));
    componentRef.setInput('serie', serie);
    componentRef.setInput('anio', 2026);
    fixture.detectChanges();
    expect(component.chartData.datasets[0].data[0]).toBe(500);
    expect(component.chartData.datasets[0].data[3]).toBe(0);
  });
});
