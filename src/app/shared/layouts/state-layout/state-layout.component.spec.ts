import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StateLayoutComponent } from './state-layout.component';

@Component({
  imports: [StateLayoutComponent],
  template: `<app-state-layout><p>Cuenta verificada</p></app-state-layout>`,
})
class HostComponent {}

@Component({
  imports: [StateLayoutComponent],
  template: `<app-state-layout align="start"><p>Listado</p></app-state-layout>`,
})
class HostAlineadoAlInicioComponent {}

describe('StateLayoutComponent', () => {
  function createFixture() {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza el encabezado de estado', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('app-public-header')).toBeTruthy();
  });

  it('proyecta el contenido dentro de ch-state-layout__content', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('.ch-state-layout__content')?.textContent).toContain(
      'Cuenta verificada'
    );
  });

  it('no aplica el modificador de alineacion al inicio por defecto', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('.ch-state-layout__content--start')).toBeFalsy();
  });

  it('aplica el modificador de alineacion al inicio cuando align="start"', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostAlineadoAlInicioComponent],
      providers: [provideRouter([])],
    }).createComponent(HostAlineadoAlInicioComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ch-state-layout__content--start')).toBeTruthy();
  });
});
