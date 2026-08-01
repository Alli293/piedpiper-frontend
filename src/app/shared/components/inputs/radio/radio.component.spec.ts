import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RadioComponent } from './radio.component';
import { RadioGroupDirective } from './radio-group.directive';

@Component({
  imports: [RadioComponent, RadioGroupDirective],
  template: `
    <div appRadioGroup [value]="value" (valueChange)="value = $event">
      <app-radio value="a" label="Opción A" [disabled]="disabledA" />
      <app-radio value="b" label="Opción B" />
    </div>
  `,
})
class HostComponent {
  value: string | null = null;
  disabledA = false;
}

@Component({
  imports: [RadioComponent],
  template: `<app-radio value="sola" label="Sin grupo" />`,
})
class HostSinGrupoComponent {}

describe('RadioComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  function radios(fixture: ReturnType<typeof createFixture>): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
  }

  it('renderiza una opción por cada app-radio con su label', () => {
    const fixture = createFixture();

    const root = fixture.nativeElement as HTMLElement;
    const etiquetas = Array.from(root.querySelectorAll<HTMLElement>('.ch-radio__label')).map(
      (el) => el.textContent
    );
    expect(etiquetas).toEqual(['Opción A', 'Opción B']);
  });

  it('comparte el mismo name entre todas las opciones del grupo', () => {
    const fixture = createFixture();

    const [a, b] = radios(fixture);
    expect(a.name).not.toBe('');
    expect(a.name).toBe(b.name);
  });

  it('marca como checked la opción cuyo value coincide con el del grupo', () => {
    const fixture = createFixture({ value: 'b' });

    const [a, b] = radios(fixture);
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
  });

  it('selecciona la opción y actualiza el valor del grupo al hacer click', () => {
    const fixture = createFixture();

    const [, b] = radios(fixture);
    b.checked = true;
    b.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toBe('b');
  });

  it('una opción deshabilitada individualmente no responde al click', () => {
    const fixture = createFixture({ disabledA: true });

    const [a] = radios(fixture);
    expect(a.disabled).toBe(true);

    a.checked = true;
    a.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toBeNull();
  });

  it('funciona sin un RadioGroupDirective inyectado: name vacío y nunca checked', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostSinGrupoComponent],
    }).createComponent(HostSinGrupoComponent);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.name).toBe('');
    expect(input.checked).toBe(false);
  });
});
