import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CheckboxComponent } from './checkbox.component';

@Component({
  imports: [CheckboxComponent],
  template: `
    <app-checkbox [checked]="checked" [disabled]="disabled" [label]="label" [error]="error" />
  `,
})
class HostComponent {
  checked = false;
  disabled = false;
  label = 'Acepto los términos';
  error = '';
}

describe('CheckboxComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  function input(fixture: ReturnType<typeof createFixture>): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  it('renderiza el label asociado al campo', () => {
    const fixture = createFixture({ label: 'Acepto los términos' });

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.textContent?.trim()).toBe('Acepto los términos');
    expect(label.getAttribute('for')).toBe(input(fixture).id);
  });

  it('refleja checked() en el input nativo', () => {
    const fixture = createFixture({ checked: true });

    expect(input(fixture).checked).toBe(true);
  });

  it('actualiza checked() y notifica al ControlValueAccessor al hacer click', () => {
    const fixture = createFixture();
    const cambios: boolean[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: boolean) =>
      cambios.push(valor)
    );

    const campo = input(fixture);
    campo.checked = true;
    campo.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(cambios).toEqual([true]);
  });

  it('notifica al ControlValueAccessor cuando el campo pierde el foco', () => {
    const fixture = createFixture();
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));

    input(fixture).dispatchEvent(new Event('blur'));

    expect(tocado).toBe(true);
  });

  it('writeValue actualiza el estado marcado', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue(true);
    fixture.detectChanges();

    expect(input(fixture).checked).toBe(true);
  });

  it('muestra el mensaje de error y marca aria-invalid cuando error() no está vacío', () => {
    const fixture = createFixture({ error: 'Debes aceptar los términos' });

    const mensaje = fixture.nativeElement.querySelector('.ch-checkbox__error');
    expect(mensaje?.textContent).toBe('Debes aceptar los términos');
    expect(input(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('deshabilita el input cuando disabled() es true', () => {
    const fixture = createFixture({ disabled: true });

    expect(input(fixture).disabled).toBe(true);
  });

  it('deshabilita el input cuando el formulario lo marca vía setDisabledState', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect(input(fixture).disabled).toBe(true);
  });
});
