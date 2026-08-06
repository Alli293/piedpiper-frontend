import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StateLayoutComponent } from './state-layout.component';

@Component({
  imports: [StateLayoutComponent],
  template: `<app-state-layout><p>Cuenta verificada</p></app-state-layout>`,
})
class HostComponent {}

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
});
