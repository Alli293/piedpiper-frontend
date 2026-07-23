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

  it('inicializa con datos vacios cuando no hay serie', () => {
    componentRef.setInput(
      'serie',
      Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, totalCarbonKg: 0 }))
    );
    fixture.detectChanges();
    expect(component.chartData().datasets[0].data).toHaveLength(12);
    expect(component.chartData().datasets[0].data.every((v) => v === 0)).toBe(true);
  });

  it('transforma la serie en datos del grafico', () => {
    const serie: PuntoMensual[] = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      totalCarbonKg: i < 3 ? 500 : 0,
    }));
    componentRef.setInput('serie', serie);
    componentRef.setInput('anio', 2026);
    fixture.detectChanges();
    expect(component.chartData().datasets[0].data[0]).toBe(500);
    expect(component.chartData().datasets[0].data[3]).toBe(0);
  });

  it('incluye el anio en el label del dataset', () => {
    componentRef.setInput(
      'serie',
      Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, totalCarbonKg: 10 }))
    );
    componentRef.setInput('anio', 2025);
    fixture.detectChanges();
    expect(component.chartData().datasets[0].label).toContain('2025');
  });

  it('actualiza chartData reactivamente cuando cambia la serie', () => {
    componentRef.setInput(
      'serie',
      Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, totalCarbonKg: 0 }))
    );
    fixture.detectChanges();
    expect(component.chartData().datasets[0].data[0]).toBe(0);

    componentRef.setInput(
      'serie',
      Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, totalCarbonKg: 100 }))
    );
    // No second detectChanges() needed — chartData is a computed signal
    expect(component.chartData().datasets[0].data[0]).toBe(100);
  });
});
