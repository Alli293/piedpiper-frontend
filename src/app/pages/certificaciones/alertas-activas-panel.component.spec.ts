import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertaVencimiento } from '../dashboard/dashboard.model';
import { AlertasActivasPanelComponent } from './alertas-activas-panel.component';

describe('AlertasActivasPanelComponent', () => {
  let fixture: ComponentFixture<AlertasActivasPanelComponent>;

  const VENCIDA: AlertaVencimiento = {
    idCertificacion: 'c1',
    nombre: 'Bandera Azul Ecológica 2025',
    fechaVencimiento: '2026-06-04',
    diasRestantes: -24,
    urgencia: 'vencida',
  };

  const URGENTE: AlertaVencimiento = {
    idCertificacion: 'c2',
    nombre: 'GHG Protocol — Corporate Standard',
    fechaVencimiento: '2026-07-03',
    diasRestantes: 5,
    urgencia: '7_dias',
  };

  const PROXIMA: AlertaVencimiento = {
    idCertificacion: 'c3',
    nombre: 'Carbono Neutral — PPCN 2026',
    fechaVencimiento: '2026-07-18',
    diasRestantes: 20,
    urgencia: '30_dias',
  };

  async function createFixture(): Promise<ComponentFixture<AlertasActivasPanelComponent>> {
    await TestBed.configureTestingModule({
      imports: [AlertasActivasPanelComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const created = TestBed.createComponent(AlertasActivasPanelComponent);
    created.detectChanges();
    return created;
  }

  it('renderiza las alertas ordenadas de menor a mayor dias restantes, con las vencidas primero', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('alertas', [PROXIMA, URGENTE, VENCIDA]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const nombres = Array.from(el.querySelectorAll('.ch-alertas-panel__item-nombre strong')).map(
      (n) => n.textContent?.trim()
    );
    expect(nombres).toEqual([
      'Bandera Azul Ecológica 2025',
      'GHG Protocol — Corporate Standard',
      'Carbono Neutral — PPCN 2026',
    ]);
  });

  it('diferencia visualmente las alertas vencidas', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('alertas', [VENCIDA, PROXIMA]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.ch-alertas-panel__item');
    expect(items[0].classList.contains('ch-alertas-panel__item--danger')).toBe(true);
    expect(items[0].querySelector('.ch-alertas-panel__badge-vencida')?.textContent).toContain(
      'Vencida'
    );
    expect(items[1].classList.contains('ch-alertas-panel__item--warning')).toBe(true);
    expect(items[1].querySelector('.ch-alertas-panel__badge-vencida')).toBeNull();
  });

  it('muestra el mensaje de vacío cuando no hay alertas', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('alertas', []);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-alertas-panel__vacio')?.textContent).toContain(
      'No hay alertas activas en este momento.'
    );
  });

  it('cada alerta enlaza a la vista de detalle de su certificación', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('alertas', [URGENTE]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const enlace = el.querySelector('.ch-alertas-panel__item') as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toBe('/empresa/certificaciones/c2');
  });

  it('muestra el mensaje de error cuando falla la carga', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput(
      'error',
      'No fue posible cargar esta sección. Intenta recargar la página.'
    );
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-alertas-panel__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
  });
});
