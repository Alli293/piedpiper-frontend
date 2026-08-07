import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MetaReduccion } from '../metas/metas.model';
import { MetasReduccionPanelComponent } from './metas-reduccion-panel.component';

describe('MetasReduccionPanelComponent', () => {
  let fixture: ComponentFixture<MetasReduccionPanelComponent>;

  const META_EN_PROGRESO: MetaReduccion = {
    id: 'm1',
    nombreMeta: 'Reducir huella total a 4,200 tCO2e',
    valorObjetivoHuellaT: 4200,
    fechaLimite: '2027-12-31',
    huellaActualT: 3024,
    progresoPorcentaje: 72,
    vencida: false,
    fechaCreacion: '2026-01-01T00:00:00Z',
  };

  const META_VENCIDA: MetaReduccion = {
    id: 'm2',
    nombreMeta: 'Compensar 100% de vuelos corporativos',
    valorObjetivoHuellaT: 95,
    fechaLimite: '2026-05-31',
    huellaActualT: 57,
    progresoPorcentaje: 60,
    vencida: true,
    fechaCreacion: '2026-01-01T00:00:00Z',
  };

  async function createFixture(): Promise<ComponentFixture<MetasReduccionPanelComponent>> {
    await TestBed.configureTestingModule({
      imports: [MetasReduccionPanelComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const created = TestBed.createComponent(MetasReduccionPanelComponent);
    created.detectChanges();
    return created;
  }

  it('renderiza el progreso actualizado de cada meta', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('metas', [META_EN_PROGRESO]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-metas-panel__item-copy strong')?.textContent).toContain(
      'Reducir huella total a 4,200 tCO2e'
    );
    expect(el.querySelector('.ch-metas-panel__progreso strong')?.textContent?.trim()).toBe('72%');
  });

  it('muestra el estado vencida en las metas con fecha pasada', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('metas', [META_VENCIDA]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-metas-panel__item')?.classList).toContain(
      'ch-metas-panel__item--vencida'
    );
    expect(el.querySelector('.ch-metas-panel__estado')?.textContent).toContain('Vencida');
    expect(el.querySelector('.ch-metas-panel__vencida-detalle')?.textContent).toContain(
      'sin completar'
    );
  });

  it('muestra el mensaje de vacío con el botón "Agregar meta" cuando no hay metas', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('metas', []);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-metas-panel__vacio p')?.textContent).toContain(
      'No has registrado metas de reducción aún.'
    );
    expect(el.querySelector('.ch-metas-panel__vacio app-button')).toBeTruthy();
  });

  it('muestra el mensaje de error cuando falla la carga', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput(
      'error',
      'No fue posible cargar esta sección. Intenta recargar la página.'
    );
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-metas-panel__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
  });
});
