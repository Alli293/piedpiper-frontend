import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ComponentRef, input } from '@angular/core';
import { CertificacionesDetalleComponent } from './certificaciones-detalle.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CertificacionActiva } from '../models/puntuacion-ambiental.model';

@Component({
  selector: 'app-icon',
  template: '<span class="stub-icon"></span>',
})
class IconStubComponent {
  name = input.required<string>();
  size = input(16);
}

describe('CertificacionesDetalleComponent', () => {
  let fixture: ComponentFixture<CertificacionesDetalleComponent>;
  let componentRef: ComponentRef<CertificacionesDetalleComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificacionesDetalleComponent],
    })
      .overrideComponent(CertificacionesDetalleComponent, {
        remove: { imports: [IconComponent] },
        add: { imports: [IconStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CertificacionesDetalleComponent);
    componentRef = fixture.componentRef;
    el = fixture.nativeElement as HTMLElement;
  });

  it('shows certification list when array has items', () => {
    componentRef.setInput('certificaciones', buildCertificaciones(2));
    fixture.detectChanges();

    const items = el.querySelectorAll('.ch-cert-detalle__item');
    expect(items.length).toBe(2);
    expect(el.querySelector('.ch-cert-detalle__nombre')?.textContent).toContain('Certificación 1');
  });

  it('hides when array is empty', () => {
    componentRef.setInput('certificaciones', []);
    fixture.detectChanges();

    expect(el.querySelector('.ch-cert-detalle')).toBeFalsy();
  });

  it('hides when array is undefined/null', () => {
    componentRef.setInput('certificaciones', undefined);
    fixture.detectChanges();

    expect(el.querySelector('.ch-cert-detalle')).toBeFalsy();
  });

  it('displays correct certification count in summary', () => {
    componentRef.setInput('certificaciones', buildCertificaciones(3));
    fixture.detectChanges();

    const summary = el.querySelector('.ch-cert-detalle__summary');
    expect(summary?.textContent).toContain('3');
    expect(summary?.textContent).toContain('certificación(es) activa(s)');
  });

  it('formats date in es-CR locale', () => {
    const cert: CertificacionActiva[] = [
      { id: '1', nombre: 'CST', fechaEmision: '2024-03-15T12:00:00Z' },
    ];
    componentRef.setInput('certificaciones', cert);
    fixture.detectChanges();

    const fecha = el.querySelector('.ch-cert-detalle__fecha');
    // es-CR format: dd mon yyyy (e.g. "15 mar 2024")
    expect(fecha?.textContent?.trim()).toMatch(/15.*mar.*2024/i);
  });

  function buildCertificaciones(count: number): CertificacionActiva[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `cert-${i + 1}`,
      nombre: `Certificación ${i + 1}`,
      fechaEmision: `2024-0${i + 1}-10T00:00:00Z`,
    }));
  }
});
