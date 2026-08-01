import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateInputComponent } from './date-input.component';

@Component({
  imports: [DateInputComponent],
  template: `
    <app-date-input
      [label]="label"
      [error]="error"
      [hint]="hint"
      [disabled]="disabled"
      [required]="required"
      [max]="max"
      [min]="min"
    />
  `,
})
class HostComponent {
  label: string | undefined = 'Fecha de actividad';
  error = '';
  hint = '';
  disabled = false;
  required = false;
  max: Date | undefined;
  min: Date | undefined;
}

describe('DateInputComponent', () => {
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
    const fixture = createFixture({ label: 'Fecha de actividad' });

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.textContent?.trim()).toContain('Fecha de actividad');
    expect(label.getAttribute('for')).toBe(campo(fixture).id);
  });

  it('muestra value() formateado como yyyy-MM-dd', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue(new Date(Date.UTC(2026, 6, 5)));
    fixture.detectChanges();

    expect(campo(fixture).value).toBe('2026-07-05');
  });

  it('aplica max() y min() como atributos yyyy-MM-dd', () => {
    const fixture = createFixture({
      max: new Date(Date.UTC(2026, 11, 31)),
      min: new Date(Date.UTC(2026, 0, 1)),
    });

    expect(campo(fixture).max).toBe('2026-12-31');
    expect(campo(fixture).min).toBe('2026-01-01');
  });

  it('notifica al ControlValueAccessor cuando el usuario elige una fecha', () => {
    const fixture = createFixture();
    const cambios: (Date | null)[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: Date | null) =>
      cambios.push(valor)
    );

    const input = campo(fixture);
    input.value = '2026-03-15';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(cambios.length).toBe(1);
    expect(cambios[0]?.toISOString().slice(0, 10)).toBe('2026-03-15');
  });

  it('notifica al ControlValueAccessor cuando el campo pierde el foco', () => {
    const fixture = createFixture();
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));

    campo(fixture).dispatchEvent(new Event('blur'));

    expect(tocado).toBe(true);
  });

  it('muestra el mensaje de error cuando error() no está vacío', () => {
    const fixture = createFixture({ error: 'Fecha inválida' });

    expect(fixture.nativeElement.querySelector('.ch-text-input__error')?.textContent).toBe(
      'Fecha inválida'
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
