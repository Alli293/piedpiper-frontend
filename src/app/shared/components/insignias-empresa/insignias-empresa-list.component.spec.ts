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
    codigoVerificacion: 'CH-2026-AAAA1111',
  },
  {
    idInsignia: 2,
    nivelInsignia: 'oro',
    nombre: 'Energia renovable',
    descripcion: 'Uso sostenido de energia renovable.',
    fechaObtencion: '2026-02-20T00:00:00Z',
    codigoVerificacion: 'CH-2026-BBBB2222',
    urlVerificacionJwt: 'https://api.carbonhub.example/insignias/2/verificacion.jwt',
    urlLinkedIn: 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME',
  },
];

@Component({
  imports: [InsigniasEmpresaListComponent],
  template: `
    <app-insignias-empresa-list
      titulo="Insignias activas"
      nombreEmpresa="Cafe del Valle S.A."
      [insignias]="insignias"
      [accionesPrivadas]="accionesPrivadas"
      [seleccionInicial]="seleccionInicial"
      (verificarOpenBadges)="verificarOpenBadges($event)"
      (descargarJwt)="descargarJwt($event)"
      (compartirLinkedIn)="compartirLinkedIn($event)"
    />
  `,
})
class HostComponent {
  insignias = INSIGNIAS;
  accionesPrivadas = false;
  seleccionInicial: string | null = null;
  verificadas: InsigniaEmpresa[] = [];
  descargadas: InsigniaEmpresa[] = [];
  compartidas: InsigniaEmpresa[] = [];

  verificarOpenBadges(insignia: InsigniaEmpresa): void {
    this.verificadas.push(insignia);
  }

  descargarJwt(insignia: InsigniaEmpresa): void {
    this.descargadas.push(insignia);
  }

  compartirLinkedIn(insignia: InsigniaEmpresa): void {
    this.compartidas.push(insignia);
  }
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

  function abrirDetalle(root: HTMLElement, nombre: string): void {
    const boton = Array.from(root.querySelectorAll<HTMLElement>('.ch-ie__card-detalle')).find((b) =>
      b.closest('.ch-ie__card')?.textContent?.includes(nombre)
    );
    boton?.querySelector('button')?.click();
  }

  it('renderiza las insignias ordenadas por fecha de obtencion descendente', () => {
    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;
    const tarjetas = Array.from(root.querySelectorAll<HTMLElement>('.ch-ie__card'));

    expect(root.textContent).toContain('Insignias activas de Cafe del Valle S.A.');
    expect(tarjetas[0].textContent).toContain('Energia renovable');
    expect(tarjetas[1].textContent).toContain('Carbono Neutral');
    expect(root.textContent).toContain('OpenBadges 3.0');
    expect(root.textContent).toContain('CarbonHub');
  });

  it('no muestra el modal de detalle hasta hacer click en "Ver detalle"', () => {
    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('abre el modal con el detalle de la insignia al hacer click en "Ver detalle"', () => {
    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    abrirDetalle(root, 'Carbono Neutral');
    fixture.detectChanges();

    const detalle = root.querySelector('app-modal') as HTMLElement;
    expect(detalle).not.toBeNull();
    expect(detalle.textContent).toContain('Carbono Neutral');
    expect(detalle.textContent).toContain('CarbonHub');
  });

  it('no renderiza el icono de esquina de verificacion en las tarjetas', () => {
    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-ie__card-status')).toBeNull();
  });

  it('en contexto publico (accionesPrivadas=false) solo muestra la accion de verificar', () => {
    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    abrirDetalle(root, 'Energia renovable');
    fixture.detectChanges();

    const acciones = root.querySelectorAll('.ch-detalle-panel__acciones app-button');
    expect(acciones.length).toBe(1);
    expect(root.querySelector('app-modal')?.textContent).toContain('Verificar');
  });

  it('en contexto privado (accionesPrivadas=true) muestra descargar, verificar y compartir', () => {
    const fixture = crear();
    fixture.componentInstance.accionesPrivadas = true;
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    abrirDetalle(root, 'Energia renovable');
    fixture.detectChanges();

    const acciones = root.querySelectorAll('.ch-detalle-panel__acciones app-button');
    expect(acciones.length).toBe(3);
  });

  it('emite descargarJwt y compartirLinkedIn al hacer click en las acciones privadas', () => {
    const fixture = crear();
    fixture.componentInstance.accionesPrivadas = true;
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    abrirDetalle(root, 'Energia renovable');
    fixture.detectChanges();

    const botones = root.querySelectorAll<HTMLElement>('.ch-detalle-panel__acciones app-button');
    botones[0].querySelector('button')?.click();
    botones[2].querySelector('button')?.click();

    expect(fixture.componentInstance.descargadas).toEqual([INSIGNIAS[1]]);
    expect(fixture.componentInstance.compartidas).toEqual([INSIGNIAS[1]]);
  });

  it('preselecciona y abre el modal segun seleccionInicial sin pisar un click posterior', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.componentInstance.seleccionInicial = '1-bronce';
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-modal')?.textContent).toContain('Carbono Neutral');

    abrirDetalle(root, 'Energia renovable');
    fixture.detectChanges();

    expect(root.querySelector('app-modal')?.textContent).toContain('Energia renovable');
  });

  it('muestra estado vacio cuando no hay insignias activas', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostVacioComponent],
    }).createComponent(HostVacioComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Sin insignias activas');
    expect(root.querySelector('.ch-ie__card')).toBeNull();
  });
});
