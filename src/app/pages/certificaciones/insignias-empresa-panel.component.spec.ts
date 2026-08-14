import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InsigniaEmpresa } from '../../core/empresa/empresa.models';
import { InsigniasEmpresaPanelComponent } from './insignias-empresa-panel.component';

describe('InsigniasEmpresaPanelComponent', () => {
  let fixture: ComponentFixture<InsigniasEmpresaPanelComponent>;

  const INSIGNIA_RECIENTE: InsigniaEmpresa = {
    idInsignia: 1,
    nivelInsignia: 'oro',
    nombre: 'Carbono Neutral 2026',
    descripcion: 'Reconocimiento por neutralidad de carbono.',
    fechaObtencion: '2026-04-12T00:00:00Z',
  };

  const INSIGNIA_ANTIGUA: InsigniaEmpresa = {
    idInsignia: 2,
    nivelInsignia: 'bronce',
    nombre: 'Reforestación activa',
    descripcion: 'Reconocimiento por participación en reforestación.',
    fechaObtencion: '2026-01-15T00:00:00Z',
  };

  async function createFixture(): Promise<ComponentFixture<InsigniasEmpresaPanelComponent>> {
    await TestBed.configureTestingModule({
      imports: [InsigniasEmpresaPanelComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const created = TestBed.createComponent(InsigniasEmpresaPanelComponent);
    created.detectChanges();
    return created;
  }

  it('renderiza las insignias ordenadas por fecha de obtención descendente, con nombre y nivel', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('insignias', [INSIGNIA_ANTIGUA, INSIGNIA_RECIENTE]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const nombres = Array.from(el.querySelectorAll('.ch-insignias-panel__item-copy strong')).map(
      (n) => n.textContent?.trim()
    );
    expect(nombres).toEqual(['Carbono Neutral 2026', 'Reforestación activa']);

    const niveles = Array.from(el.querySelectorAll('.ch-insignias-panel__nivel')).map((n) =>
      n.textContent?.trim()
    );
    expect(niveles).toEqual(['Oro', 'Bronce']);
  });

  it('muestra como máximo 4 insignias, las más recientes', async () => {
    fixture = await createFixture();
    const insignias = Array.from({ length: 6 }, (_, i) => ({
      ...INSIGNIA_RECIENTE,
      idInsignia: i,
      nombre: `Insignia ${i}`,
      fechaObtencion: `2026-0${(i % 9) + 1}-01T00:00:00Z`,
    }));
    fixture.componentRef.setInput('insignias', insignias);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.ch-insignias-panel__item').length).toBe(4);
  });

  it('muestra el mensaje de vacío cuando la lista está vacía', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('insignias', []);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-insignias-panel__vacio')?.textContent).toContain(
      'Aún no has obtenido insignias. Completa tus certificaciones para comenzar.'
    );
  });

  it('cada insignia es un enlace a su vista de detalle', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('insignias', [INSIGNIA_RECIENTE]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const enlace = el.querySelector('.ch-insignias-panel__item') as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toContain('/empresa/insignias');
    expect(enlace.getAttribute('href')).toContain('insignia=1-oro');
  });

  it('muestra el mensaje de error cuando falla la carga', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput(
      'error',
      'No fue posible cargar esta sección. Intenta recargar la página.'
    );
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-insignias-panel__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
  });
});
