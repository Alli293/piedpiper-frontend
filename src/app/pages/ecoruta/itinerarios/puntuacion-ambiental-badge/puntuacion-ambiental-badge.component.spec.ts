import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ComponentRef, input } from '@angular/core';
import { PuntuacionAmbientalBadgeComponent } from './puntuacion-ambiental-badge.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PuntuacionAmbientalResponse } from '../models/puntuacion-ambiental.model';

@Component({
  selector: 'app-icon',
  template: '<span class="stub-icon"></span>',
})
class IconStubComponent {
  name = input.required<string>();
  size = input(16);
}

describe('PuntuacionAmbientalBadgeComponent', () => {
  let fixture: ComponentFixture<PuntuacionAmbientalBadgeComponent>;
  let componentRef: ComponentRef<PuntuacionAmbientalBadgeComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuntuacionAmbientalBadgeComponent],
    })
      .overrideComponent(PuntuacionAmbientalBadgeComponent, {
        remove: { imports: [IconComponent] },
        add: { imports: [IconStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PuntuacionAmbientalBadgeComponent);
    componentRef = fixture.componentRef;
    el = fixture.nativeElement as HTMLElement;
  });

  it('renders badge with numeric value when puntuacion has data', () => {
    componentRef.setInput('puntuacion', buildPuntuacion(75));
    fixture.detectChanges();

    const badge = el.querySelector('.ch-puntuacion-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('75');
  });

  it('does not render when puntuacion is null', () => {
    componentRef.setInput('puntuacion', null);
    fixture.detectChanges();

    expect(el.querySelector('.ch-puntuacion-badge')).toBeFalsy();
  });

  it('applies --alto class when puntuacionTotal >= 70', () => {
    componentRef.setInput('puntuacion', buildPuntuacion(85));
    fixture.detectChanges();

    const badge = el.querySelector('.ch-puntuacion-badge');
    expect(badge?.classList.contains('ch-puntuacion-badge--alto')).toBe(true);
  });

  it('applies --medio class when puntuacionTotal is 40-69', () => {
    componentRef.setInput('puntuacion', buildPuntuacion(55));
    fixture.detectChanges();

    const badge = el.querySelector('.ch-puntuacion-badge');
    expect(badge?.classList.contains('ch-puntuacion-badge--medio')).toBe(true);
  });

  it('applies --bajo class when puntuacionTotal < 40', () => {
    componentRef.setInput('puntuacion', buildPuntuacion(25));
    fixture.detectChanges();

    const badge = el.querySelector('.ch-puntuacion-badge');
    expect(badge?.classList.contains('ch-puntuacion-badge--bajo')).toBe(true);
  });

  it('uses puntuacionTotal over puntuacionEstimada when both are present, even when puntuacionTotal is 0', () => {
    componentRef.setInput('puntuacion', buildPuntuacion(0));
    componentRef.setInput('puntuacionEstimada', 60);
    fixture.detectChanges();

    const badge = el.querySelector('.ch-puntuacion-badge');
    expect(badge?.textContent).toContain('0');
    expect(badge?.classList.contains('ch-puntuacion-badge--bajo')).toBe(true);
  });

  it('falls back to puntuacionEstimada when puntuacion is absent', () => {
    componentRef.setInput('puntuacion', null);
    componentRef.setInput('puntuacionEstimada', 45);
    fixture.detectChanges();

    const badge = el.querySelector('.ch-puntuacion-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('45');
    expect(badge?.classList.contains('ch-puntuacion-badge--medio')).toBe(true);
  });

  it('does not render when both puntuacion and puntuacionEstimada are absent', () => {
    componentRef.setInput('puntuacion', null);
    componentRef.setInput('puntuacionEstimada', null);
    fixture.detectChanges();

    expect(el.querySelector('.ch-puntuacion-badge')).toBeFalsy();
  });

  function buildPuntuacion(total: number): PuntuacionAmbientalResponse {
    return {
      puntuacionTotal: total,
      componenteCertificaciones: total * 0.5,
      componenteIma: total * 0.3,
      componenteBenchmark: total * 0.2,
      cantidadCertificacionesActivas: 3,
      estimado: false,
    };
  }
});
