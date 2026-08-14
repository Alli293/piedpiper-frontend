import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RadioGroupFieldComponent } from './radio-group-field.component';
import { SelectOption } from '../select-input/select-input.component';

const OPCIONES: SelectOption[] = [
  { value: 'aprobado', label: 'Aprobar' },
  { value: 'rechazado', label: 'Rechazar' },
];

@Component({
  imports: [RadioGroupFieldComponent],
  template: `
    <app-radio-group-field
      [label]="label"
      [options]="options"
      [error]="error"
      [disabled]="disabled"
    />
  `,
})
class HostComponent {
  label: string | undefined = 'Decisión';
  options = OPCIONES;
  error = '';
  disabled = false;
}

describe('RadioGroupFieldComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  function radios(fixture: ReturnType<typeof createFixture>): HTMLInputElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="radio"]'
      )
    );
  }

  it('renderiza el label vinculado al grupo mediante aria-labelledby', () => {
    const fixture = createFixture({ label: 'Decisión' });

    const label: HTMLElement = fixture.nativeElement.querySelector('.ch-radio-group-field__label');
    const grupo: HTMLElement = fixture.nativeElement.querySelector(
      '.ch-radio-group-field__options'
    );
    expect(label.textContent).toBe('Decisión');
    expect(grupo.getAttribute('aria-labelledby')).toBe(label.id);
  });

  it('renderiza una opción por cada elemento de options()', () => {
    const fixture = createFixture();

    const etiquetas = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.ch-radio__label')
    ).map((el) => el.textContent);
    expect(etiquetas).toEqual(['Aprobar', 'Rechazar']);
  });

  it('selecciona una opción y notifica al ControlValueAccessor', () => {
    const fixture = createFixture();
    const cambios: (string | null)[] = [];
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: string | null) =>
      cambios.push(valor)
    );
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));

    const [, rechazar] = radios(fixture);
    rechazar.checked = true;
    rechazar.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(cambios).toEqual(['rechazado']);
    expect(tocado).toBe(true);
  });

  it('writeValue marca la opción correspondiente', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue('aprobado');
    fixture.detectChanges();

    const [aprobar, rechazar] = radios(fixture);
    expect(aprobar.checked).toBe(true);
    expect(rechazar.checked).toBe(false);
  });

  it('muestra el mensaje de error con role alert', () => {
    const fixture = createFixture({ error: 'Selecciona una decisión' });

    const mensaje: HTMLElement = fixture.nativeElement.querySelector(
      '.ch-radio-group-field__error'
    );
    expect(mensaje.textContent).toBe('Selecciona una decisión');
    expect(mensaje.getAttribute('role')).toBe('alert');
  });

  it('deshabilita todas las opciones cuando disabled() es true', () => {
    const fixture = createFixture({ disabled: true });

    for (const radio of radios(fixture)) {
      expect(radio.disabled).toBe(true);
    }
  });

  it('deshabilita todas las opciones cuando el formulario lo marca vía setDisabledState', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.setDisabledState(true);
    fixture.detectChanges();

    for (const radio of radios(fixture)) {
      expect(radio.disabled).toBe(true);
    }
  });
});
