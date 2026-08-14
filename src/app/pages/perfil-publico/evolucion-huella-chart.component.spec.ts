import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { EvolucionHuellaChartComponent } from './evolucion-huella-chart.component';
import { PuntoHuella } from './perfil-publico.models';

describe('EvolucionHuellaChartComponent', () => {
  let component: EvolucionHuellaChartComponent;
  let componentRef: ComponentRef<EvolucionHuellaChartComponent>;
  let fixture: ComponentFixture<EvolucionHuellaChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvolucionHuellaChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EvolucionHuellaChartComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('transforma la serie en datos del grafico', () => {
    const serie: PuntoHuella[] = [
      { periodo: '2024', huellaT: 5, variacionPorcentual: null },
      { periodo: '2025', huellaT: 4, variacionPorcentual: -20 },
      { periodo: '2026', huellaT: 3.5, variacionPorcentual: -12.5 },
    ];
    componentRef.setInput('serie', serie);
    fixture.detectChanges();

    expect(component.chartData().labels).toEqual(['2024', '2025', '2026']);
    expect(component.chartData().datasets[0].data).toEqual([5, 4, 3.5]);
  });

  it('mantiene tooltip con valor y variacion del punto', () => {
    componentRef.setInput('serie', [
      { periodo: '2025', huellaT: 5.236, variacionPorcentual: null },
      { periodo: '2026', huellaT: 4.2, variacionPorcentual: -19.8 },
    ]);
    fixture.detectChanges();

    const options = component.chartOptions();
    const callbacks = options?.plugins?.tooltip?.callbacks as {
      label: (contexto: { parsed: { y: number } }) => string;
      afterLabel: (contexto: { dataIndex: number }) => string;
    };
    const label = callbacks.label({ parsed: { y: 4.2 } });
    const afterLabel = callbacks.afterLabel({ dataIndex: 1 });

    expect(label).toContain('4,2');
    expect(afterLabel).toContain('-19,8%');
  });
});
