import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NumberInputComponent } from './number-input.component';

@Component({
  imports: [NumberInputComponent],
  template: `
    <app-number-input
      [label]="label"
      [error]="error"
      [hint]="hint"
      [disabled]="disabled"
      [required]="required"
    />
  `,
})
class HostComponent {
  label: string | undefined = 'Distancia (km)';
  error = '';
  hint = '';
  disabled = false;
  required = false;
}

describe('NumberInputComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  function campo(fixture: ReturnType<typeof createFixture>): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  it('renderiza la etiqueta asociada al campo', () => {
    const fixture = createFixture({ label: 'Distancia (km)' });

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.textContent?.trim()).toContain('Distancia (km)');
    expect(label.getAttribute('for')).toBe(campo(fixture).id);
  });

  it('muestra cadena vacía cuando value() es null', () => {
    const fixture = createFixture();

    expect(campo(fixture).value).toBe('');
  });

  it('writeValue actualiza el valor mostrado', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue(42.5);
    fixture.detectChanges();

    expect(campo(fixture).value).toBe('42.5');
  });

  it('actualiza value() y notifica al ControlValueAccessor con un número al escribir', () => {
    const fixture = createFixture();
    const cambios: (number | null)[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: number | null) =>
      cambios.push(valor)
    );

    const input = campo(fixture);
    input.value = '100';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(cambios).toEqual([100]);
  });

  it('notifica null cuando el campo queda vacío o no numérico', () => {
    const fixture = createFixture();
    const cambios: (number | null)[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: number | null) =>
      cambios.push(valor)
    );

    const input = campo(fixture);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(cambios).toEqual([null]);
  });

  it('notifica al ControlValueAccessor cuando el campo pierde el foco', () => {
    const fixture = createFixture();
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));

    campo(fixture).dispatchEvent(new Event('blur'));

    expect(tocado).toBe(true);
  });

  it('muestra el mensaje de error cuando error() no está vacío', () => {
    const fixture = createFixture({ error: 'Debe ser mayor a 0' });

    expect(fixture.nativeElement.querySelector('.ch-text-input__error')?.textContent).toBe(
      'Debe ser mayor a 0'
    );
  });

  it('deshabilita el campo cuando disabled() es true', () => {
    const fixture = createFixture({ disabled: true });

    expect(campo(fixture).disabled).toBe(true);
  });

  it('deshabilita el campo cuando el formulario lo marca vía setDisabledState', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect(campo(fixture).disabled).toBe(true);
  });
});
