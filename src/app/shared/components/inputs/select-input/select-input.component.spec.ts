import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SelectInputComponent, SelectOption } from './select-input.component';

const OPCIONES: SelectOption[] = [
  { value: 'cr', label: 'Costa Rica' },
  { value: 'mx', label: 'México' },
];

@Component({
  imports: [SelectInputComponent],
  template: `
    <app-select-input
      [label]="label"
      [options]="options"
      [placeholder]="placeholder"
      [error]="error"
      [hint]="hint"
      [disabled]="disabled"
      [ariaLabel]="ariaLabel"
    />
  `,
})
class HostComponent {
  label: string | undefined = 'País';
  options = OPCIONES;
  placeholder = 'Seleccionar...';
  error = '';
  hint = '';
  disabled = false;
  ariaLabel: string | null = null;
}

describe('SelectInputComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  function select(fixture: ReturnType<typeof createFixture>): HTMLSelectElement {
    return fixture.nativeElement.querySelector('select');
  }

  it('renderiza la etiqueta asociada al campo', () => {
    const fixture = createFixture({ label: 'País' });

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.textContent?.trim()).toBe('País');
    expect(label.getAttribute('for')).toBe(select(fixture).id);
  });

  it('renderiza el placeholder y las opciones recibidas', () => {
    const fixture = createFixture();

    const opciones: HTMLOptionElement[] = Array.from(select(fixture).querySelectorAll('option'));
    expect(opciones.map((o) => o.textContent?.trim())).toEqual([
      'Seleccionar...',
      'Costa Rica',
      'México',
    ]);
  });

  it('actualiza value() y notifica al ControlValueAccessor cuando el usuario elige una opción', () => {
    const fixture = createFixture();
    const cambios: string[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: string) =>
      cambios.push(valor)
    );

    const campo = select(fixture);
    campo.value = 'mx';
    campo.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(cambios).toEqual(['mx']);
    expect(campo.value).toBe('mx');
  });

  it('notifica al ControlValueAccessor cuando el campo pierde el foco', () => {
    const fixture = createFixture();
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));

    select(fixture).dispatchEvent(new Event('blur'));

    expect(tocado).toBe(true);
  });

  it('writeValue selecciona la opción correspondiente', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue('cr');
    fixture.detectChanges();

    expect(select(fixture).value).toBe('cr');
  });

  it('muestra el mensaje de error y marca aria-invalid cuando error() no está vacío', () => {
    const fixture = createFixture({ error: 'Selecciona un país' });

    const mensaje = fixture.nativeElement.querySelector('.ch-select-input__error');
    expect(mensaje?.textContent).toBe('Selecciona un país');
    expect(select(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('muestra el hint solo cuando no hay error', () => {
    const fixture = createFixture({ hint: 'Usado para el prefijo telefónico' });

    expect(fixture.nativeElement.querySelector('.ch-select-input__hint')?.textContent).toBe(
      'Usado para el prefijo telefónico'
    );
  });

  it('deshabilita el select cuando disabled() es true', () => {
    const fixture = createFixture({ disabled: true });

    expect(select(fixture).disabled).toBe(true);
  });

  it('deshabilita el select cuando el formulario lo marca vía setDisabledState', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect(select(fixture).disabled).toBe(true);
  });

  it('usa ariaLabel() como aria-label cuando se provee', () => {
    const fixture = createFixture({ ariaLabel: 'Selecciona tu país' });

    expect(select(fixture).getAttribute('aria-label')).toBe('Selecciona tu país');
  });

  it('usa label() como aria-label cuando no se provee ariaLabel()', () => {
    const fixture = createFixture({ label: 'País', ariaLabel: null });

    expect(select(fixture).getAttribute('aria-label')).toBe('País');
  });
});
