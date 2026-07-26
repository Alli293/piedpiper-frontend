import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HeadingComponent, HeadingLevel } from './heading.component';

@Component({
  imports: [HeadingComponent],
  template: `<app-heading [level]="level" [appearance]="appearance" [text]="text" />`,
})
class HostComponent {
  level: HeadingLevel = 'h1';
  appearance: HeadingLevel | undefined;
  text = 'Título';
}

describe('HeadingComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it.each<[HeadingLevel, string]>([
    ['h1', 'H1'],
    ['h2', 'H2'],
    ['h3', 'H3'],
    ['h4', 'H4'],
  ])('renderiza un <%s> cuando level() es %s', (level, tagName) => {
    const fixture = createFixture({ level });

    const elemento = fixture.nativeElement.querySelector(tagName);
    expect(elemento).toBeTruthy();
    expect(elemento.textContent).toBe('Título');
  });

  it('usa level() como clase visual cuando no se especifica appearance()', () => {
    const fixture = createFixture({ level: 'h2' });

    const elemento = fixture.nativeElement.querySelector('h2');
    expect(elemento.classList.contains('ch-heading--h2')).toBe(true);
  });

  it('usa appearance() como clase visual sin cambiar la etiqueta semántica', () => {
    const fixture = createFixture({ level: 'h1', appearance: 'h3' });

    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1.classList.contains('ch-heading--h3')).toBe(true);
    expect(h1.classList.contains('ch-heading--h1')).toBe(false);
  });
});
