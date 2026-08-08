import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { EstadoCertificacionesPanelComponent } from './estado-certificaciones-panel.component';
import { ResumenCertificacionesDashboardResponse } from '../dashboard/dashboard.model';

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

  const resumen = (): ResumenCertificacionesDashboardResponse => ({
    activas: 5,
    proximasAVencer: 3,
    vencidas: 1,
  });

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

  it('renderiza los tres conteos con sus valores', () => {
    componentRef.setInput('resumen', resumen());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const valores = Array.from(el.querySelectorAll('.ch-estado-cert__card-value')).map((n) =>
      n.textContent?.trim()
    );
    expect(valores).toEqual(['5', '3', '1']);
  });

  it('muestra 0 en los tres conteos cuando no hay certificaciones', () => {
    componentRef.setInput('resumen', { activas: 0, proximasAVencer: 0, vencidas: 0 });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const valores = Array.from(el.querySelectorAll('.ch-estado-cert__card-value')).map((n) =>
      n.textContent?.trim()
    );
    expect(valores).toEqual(['0', '0', '0']);
  });

  it('cada conteo enlaza al listado filtrado por su estado', () => {
    componentRef.setInput('resumen', resumen());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = Array.from(el.querySelectorAll('.ch-estado-cert__card')) as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/empresa/certificaciones/listado?estado=activa',
      '/empresa/certificaciones/listado?estado=proxima_a_vencer',
      '/empresa/certificaciones/listado?estado=vencida',
    ]);
  });

  it('usa la etiqueta singular "Vencida" cuando el conteo es 1', () => {
    componentRef.setInput('resumen', { activas: 0, proximasAVencer: 0, vencidas: 1 });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const labels = Array.from(el.querySelectorAll('.ch-estado-cert__card-label')).map((n) =>
      n.textContent?.trim()
    );
    expect(labels[2]).toBe('Vencida');
  });
});
