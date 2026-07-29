import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LinkDirective } from './link.directive';

@Component({
  imports: [LinkDirective],
  template: `<a appLink href="/ayuda">Centro de ayuda</a>`,
})
class HostComponent {}

describe('LinkDirective', () => {
  it('aplica la clase ch-link al elemento anchor', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    fixture.detectChanges();

    const enlace: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(enlace.classList.contains('ch-link')).toBe(true);
  });
});
