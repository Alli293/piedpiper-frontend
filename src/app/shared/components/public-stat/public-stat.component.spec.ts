import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PublicStatComponent } from './public-stat.component';

@Component({
  imports: [PublicStatComponent],
  template: `<app-public-stat [value]="value" [label]="label" />`,
})
class HostComponent {
  value = '128';
  label = 'Empresas verificadas';
}

describe('PublicStatComponent', () => {
  it('renderiza el valor y el label recibidos', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ch-public-stat__value').textContent).toBe('128');
    expect(fixture.nativeElement.querySelector('.ch-public-stat__label').textContent).toBe(
      'Empresas verificadas'
    );
  });
});
