import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InsigniaEmpresa } from '../../../core/empresa/empresa.models';
import { InsigniasEmpresaListComponent } from './insignias-empresa-list.component';

const INSIGNIAS: InsigniaEmpresa[] = [
  {
    idInsignia: 1,
    nivelInsignia: 'bronce',
    nombre: 'Carbono Neutral',
    descripcion: 'Primera insignia activa.',
    fechaObtencion: '2026-01-15T00:00:00Z',
  },
  {
    idInsignia: 2,
    nivelInsignia: 'oro',
    nombre: 'Energia renovable',
    descripcion: 'Uso sostenido de energia renovable.',
    fechaObtencion: '2026-02-20T00:00:00Z',
  },
];

@Component({
  imports: [InsigniasEmpresaListComponent],
  template: `
    <app-insignias-empresa-list
      titulo="Insignias activas"
      nombreEmpresa="Cafe del Valle S.A."
      [insignias]="insignias"
    />
  `,
})
class HostComponent {
  insignias = INSIGNIAS;
}

@Component({
  imports: [InsigniasEmpresaListComponent],
  template: ` <app-insignias-empresa-list [insignias]="[]" /> `,
})
class HostVacioComponent {}

describe('InsigniasEmpresaListComponent', () => {
  function crear(): ComponentFixture<HostComponent> {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza las insignias ordenadas por fecha de obtencion descendente', () => {
    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;
    const tarjetas = Array.from(root.querySelectorAll<HTMLElement>('.ch-insignias-empresa__card'));

    expect(root.textContent).toContain('Insignias activas de Cafe del Valle S.A.');
    expect(tarjetas[0].textContent).toContain('Energia renovable');
    expect(tarjetas[1].textContent).toContain('Carbono Neutral');
    expect(root.textContent).toContain('OpenBadges 3.0');
    expect(root.textContent).toContain('ICE / CarbonHub');
  });

  it('muestra el detalle de la insignia seleccionada', () => {
    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;
    const carbonoNeutral = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.ch-insignias-empresa__card-main')
    ).find((tarjeta) => tarjeta.textContent?.includes('Carbono Neutral'));

    carbonoNeutral?.click();
    fixture.detectChanges();

    const detalle = root.querySelector('.ch-insignias-empresa__detalle') as HTMLElement;
    expect(detalle.textContent).toContain('Carbono Neutral');
    expect(detalle.textContent).toContain('DCC / MINAE via CarbonHub');
  });

  it('muestra estado vacio cuando no hay insignias activas', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostVacioComponent],
    }).createComponent(HostVacioComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Sin insignias activas');
    expect(root.querySelector('.ch-insignias-empresa__card')).toBeNull();
  });
});
