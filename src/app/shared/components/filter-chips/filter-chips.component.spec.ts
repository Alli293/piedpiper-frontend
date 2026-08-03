import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FilterChip, FilterChipsComponent } from './filter-chips.component';

@Component({
  imports: [FilterChipsComponent],
  template: `
    <app-filter-chips
      ariaLabel="Filtrar por estado"
      [chips]="chips()"
      [activeId]="activeId()"
      (chipSelected)="onSelected($event)"
    />
  `,
})
class HostComponent {
  chips = signal<FilterChip[]>([
    { id: 'TODAS', label: 'Todas', icon: 'emisiones', count: 5 },
    { id: 'ACTIVA', label: 'Vigentes', count: 3 },
  ]);
  activeId = signal('TODAS');
  seleccionado: string | null = null;

  onSelected(id: string): void {
    this.seleccionado = id;
  }
}

@Component({
  imports: [FilterChipsComponent],
  template: `
    <app-filter-chips
      ariaLabel="Filtros"
      [chips]="[{ id: 'SOLO_LABEL', label: 'Sin icono ni conteo' }]"
      activeId="SOLO_LABEL"
    />
  `,
})
class HostSinIconoNiConteoComponent {}

describe('FilterChipsComponent', () => {
  it('renderiza un boton por chip y marca aria-pressed solo en el activo', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const botones = root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item');
    expect(botones.length).toBe(2);
    expect(botones[0].getAttribute('aria-pressed')).toBe('true');
    expect(botones[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('emite chipSelected con el id del chip al hacer click', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const botones = root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item');
    botones[1].click();

    expect(fixture.componentInstance.seleccionado).toBe('ACTIVA');
  });

  it('renderiza icono y contador solo cuando estan presentes', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const botones = root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item');
    expect(botones[0].querySelector('app-icon')).not.toBeNull();
    expect(botones[0].querySelector('strong')?.textContent?.trim()).toBe('5');
    expect(botones[1].querySelector('app-icon')).toBeNull();
    expect(botones[1].querySelector('strong')?.textContent?.trim()).toBe('3');
  });

  it('no renderiza icono ni contador cuando el chip no los define', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostSinIconoNiConteoComponent],
    }).createComponent(HostSinIconoNiConteoComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const boton = root.querySelector<HTMLButtonElement>('.ch-filter-chips__item');
    expect(boton?.querySelector('app-icon')).toBeNull();
    expect(boton?.querySelector('strong')).toBeNull();
    expect(boton?.textContent?.trim()).toBe('Sin icono ni conteo');
  });

  it('expone role="group" y el aria-label recibido en el host', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const host = root.querySelector('app-filter-chips');
    expect(host?.getAttribute('role')).toBe('group');
    expect(host?.getAttribute('aria-label')).toBe('Filtrar por estado');
  });
});
