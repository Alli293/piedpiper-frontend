import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { EstadoCertificacionesPanelComponent } from './estado-certificaciones-panel.component';
import { AlertaVencimiento } from '../dashboard/dashboard.model';

describe('EstadoCertificacionesPanelComponent', () => {
  let componentRef: ComponentRef<EstadoCertificacionesPanelComponent>;
  let fixture: ComponentFixture<EstadoCertificacionesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadoCertificacionesPanelComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(EstadoCertificacionesPanelComponent);
    componentRef = fixture.componentRef;
  });

  const alerta = (
    id: string,
    urgencia: AlertaVencimiento['urgencia'],
    diasRestantes: number
  ): AlertaVencimiento => ({
    idCertificacion: id,
    nombre: `Certificación ${id}`,
    fechaVencimiento: '2026-12-01',
    diasRestantes,
    urgencia,
  });

  const alertas = (): AlertaVencimiento[] => [
    alerta('c1', '90_dias', 88),
    alerta('c2', '90_dias', 75),
    alerta('c3', '30_dias', 25),
    alerta('c4', '7_dias', 3),
  ];

  it('muestra el mensaje de carga cuando loading es true', () => {
    componentRef.setInput('loading', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-estado-cert__loading')).toBeTruthy();
    expect(el.querySelectorAll('.ch-estado-cert__card').length).toBe(0);
  });

  it('muestra el mensaje de error cuando error tiene un valor', () => {
    componentRef.setInput(
      'error',
      'No fue posible cargar esta sección. Intenta recargar la página.'
    );
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const errorEl = el.querySelector('.ch-estado-cert__error');
    expect(errorEl).toBeTruthy();
    expect(errorEl?.textContent).toContain('No fue posible cargar esta sección');
  });

  it('renderiza los tres conteos por urgencia (informativas, próximas, urgentes)', () => {
    componentRef.setInput('alertas', alertas());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const valores = Array.from(el.querySelectorAll('.ch-estado-cert__card-value')).map((n) =>
      n.textContent?.trim()
    );
    expect(valores).toEqual(['2', '1', '1']);
  });

  it('muestra 0 en los tres conteos cuando no hay alertas', () => {
    componentRef.setInput('alertas', []);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const valores = Array.from(el.querySelectorAll('.ch-estado-cert__card-value')).map((n) =>
      n.textContent?.trim()
    );
    expect(valores).toEqual(['0', '0', '0']);
  });

  it('"Ver todas" del encabezado enlaza al Centro de Alertas', () => {
    componentRef.setInput('alertas', alertas());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const enlace = el.querySelector('.ch-estado-cert__ver-todas') as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toBe('/empresa/certificaciones/alertas');
  });

  it('"Informativas" y "Próximas a vencer" enlazan al Centro de Alertas con su propio filtro', () => {
    componentRef.setInput('alertas', alertas());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = Array.from(el.querySelectorAll('a.ch-estado-cert__card')) as HTMLAnchorElement[];
    expect(links[0].getAttribute('href')).toBe(
      '/empresa/certificaciones/alertas?filtro=INFORMATIVAS'
    );
    expect(links[1].getAttribute('href')).toBe('/empresa/certificaciones/alertas?filtro=PROXIMAS');
  });

  it('"Urgentes" enlaza al Centro de Alertas filtrado por Urgentes', () => {
    componentRef.setInput('alertas', alertas());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = Array.from(el.querySelectorAll('a.ch-estado-cert__card')) as HTMLAnchorElement[];
    expect(links[2].getAttribute('href')).toBe('/empresa/certificaciones/alertas?filtro=URGENTES');
  });

  it('usa las etiquetas Informativas / Próximas a vencer / Urgentes', () => {
    componentRef.setInput('alertas', alertas());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const labels = Array.from(el.querySelectorAll('.ch-estado-cert__card-label')).map((n) =>
      n.textContent?.trim()
    );
    expect(labels).toEqual(['Informativas', 'Próximas a vencer', 'Urgentes']);
  });
});
