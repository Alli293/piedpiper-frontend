import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EncabezadoResumenComponent } from './encabezado-resumen.component';

@Component({
  imports: [EncabezadoResumenComponent],
  template: `
    <app-encabezado-resumen
      icono="certificaciones"
      tono="success"
      titulo="Mis certificaciones"
      subtexto="Certificaciones registradas por tu empresa."
      [statValor]="4"
      statLabel="Certificaciones registradas"
    />
  `,
})
class HostConStatComponent {}

@Component({
  imports: [EncabezadoResumenComponent],
  template: ` <app-encabezado-resumen icono="notificacion" tono="danger" titulo="Sin stat" /> `,
})
class HostSinStatComponent {}

describe('EncabezadoResumenComponent', () => {
  it('renderiza el título, el subtexto y el stat cuando se proveen', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostConStatComponent],
    }).createComponent(HostConStatComponent);
    fixture.detectChanges();

    const titulo = fixture.nativeElement.querySelector('.ch-heading');
    const subtexto = fixture.nativeElement.querySelector('.ch-encabezado-resumen__copy p');
    const stat = fixture.nativeElement.querySelector('.ch-encabezado-resumen__stat');
    expect(titulo?.textContent?.trim()).toBe('Mis certificaciones');
    expect(subtexto?.textContent?.trim()).toBe('Certificaciones registradas por tu empresa.');
    expect(stat?.querySelector('strong')?.textContent?.trim()).toBe('4');
    expect(stat?.querySelector('span')?.textContent?.trim()).toBe('Certificaciones registradas');
  });

  it('no renderiza el bloque de stat cuando statValor es null', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostSinStatComponent],
    }).createComponent(HostSinStatComponent);
    fixture.detectChanges();

    const stat = fixture.nativeElement.querySelector('.ch-encabezado-resumen__stat');
    expect(stat).toBeNull();
  });

  it('aplica la clase de tono correspondiente', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostSinStatComponent],
    }).createComponent(HostSinStatComponent);
    fixture.detectChanges();

    const seccion = fixture.nativeElement.querySelector('.ch-encabezado-resumen');
    expect(seccion.classList.contains('ch-encabezado-resumen--danger')).toBe(true);
  });
});
