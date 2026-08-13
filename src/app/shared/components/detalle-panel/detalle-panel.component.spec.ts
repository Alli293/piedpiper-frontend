import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DetallePanelAccion,
  DetallePanelComponent,
  DetallePanelDato,
} from './detalle-panel.component';

@Component({
  imports: [DetallePanelComponent],
  template: `
    <app-detalle-panel
      [dato]="dato()"
      [acciones]="acciones()"
      tituloId="detalle-titulo-test"
      (accionClick)="onAccionClick($event)"
    />
  `,
})
class HostComponent {
  dato = signal<DetallePanelDato>({
    icono: 'insignias',
    iconoModificador: 'oro',
    titulo: 'Gestión ambiental avanzada',
    heroBadge: { etiqueta: 'Insignia activa', variant: 'success', icono: 'success' },
    eyebrow: 'Información de emisión',
    campos: [
      { icono: 'insignias', etiqueta: 'Insignia', valor: 'Gestión ambiental avanzada' },
      { icono: 'empresa', etiqueta: 'Emisor', valor: 'CarbonHub' },
    ],
    credencial: {
      titulo: 'Credencial verificable',
      subtitulo: 'Estándar OpenBadges 3.0',
      descripcion: 'Esta insignia es una credencial verificable.',
    },
  });

  acciones = signal<DetallePanelAccion[]>([]);
  accionRecibida: string | null = null;

  onAccionClick(id: string): void {
    this.accionRecibida = id;
  }
}

describe('DetallePanelComponent', () => {
  it('renderiza el hero con el modificador de nivel recibido', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const icono = root.querySelector('.ch-detalle-panel__icono');
    expect(icono?.classList.contains('ch-detalle-panel__icono--oro')).toBe(true);
    expect(icono?.classList.contains('ch-detalle-panel__icono--generico')).toBe(false);
    expect(root.querySelector('#detalle-titulo-test')?.textContent?.trim()).toBe(
      'Gestión ambiental avanzada'
    );
  });

  it('renderiza el circulo generico cuando no hay modificador de nivel', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.componentInstance.dato.update((d) => ({ ...d, iconoModificador: null }));
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const icono = root.querySelector('.ch-detalle-panel__icono');
    expect(icono?.classList.contains('ch-detalle-panel__icono--generico')).toBe(true);
    expect(icono?.classList.contains('ch-detalle-panel__icono--oro')).toBe(false);
  });

  it('renderiza cada campo del dl en el orden recibido', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const filas = root.querySelectorAll('.ch-detalle-panel__lista > div');
    expect(filas.length).toBe(2);
    expect(filas[0].querySelector('dt')?.textContent).toContain('Insignia');
    expect(filas[0].querySelector('dd')?.textContent?.trim()).toBe('Gestión ambiental avanzada');
    expect(filas[1].querySelector('dt')?.textContent).toContain('Emisor');
    expect(filas[1].querySelector('dd')?.textContent?.trim()).toBe('CarbonHub');
  });

  it('renderiza la copia del recuadro de credencial', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const credencial = root.querySelector('.ch-detalle-panel__credencial');
    expect(credencial?.textContent).toContain('Credencial verificable');
    expect(credencial?.textContent).toContain('Estándar OpenBadges 3.0');
    expect(credencial?.textContent).toContain('Esta insignia es una credencial verificable.');
  });

  it('no renderiza la fila de acciones cuando no hay acciones', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-detalle-panel__acciones')).toBeNull();
  });

  it('renderiza cada accion con su variante/estado y emite su id al hacer click', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.componentInstance.acciones.set([
      { id: 'descargar', etiqueta: 'Descargar (JWT)', icono: 'descargar', variant: 'secondary' },
      {
        id: 'verificar',
        etiqueta: 'Verificar',
        icono: 'redirect',
        variant: 'secondary',
        disabled: true,
      },
      { id: 'compartir', etiqueta: 'Compartir', icono: 'linkedin', variant: 'primary' },
    ]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const botones = root.querySelectorAll('.ch-detalle-panel__acciones app-button');
    expect(botones.length).toBe(3);

    const botonVerificar = botones[1].querySelector('button');
    expect(botonVerificar?.disabled).toBe(true);

    const botonDescargar = botones[0].querySelector('button');
    botonDescargar?.click();

    expect(fixture.componentInstance.accionRecibida).toBe('descargar');
  });
});
