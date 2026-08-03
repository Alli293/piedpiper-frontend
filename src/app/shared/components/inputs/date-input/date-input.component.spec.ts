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

  function abrirCalendario(fixture: ReturnType<typeof createFixture>): void {
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('.ch-date-input__icon');
    boton.click();
  }

  function calendario(): HTMLElement | null {
    return document.querySelector('.flatpickr-calendar');
  }

  function elegirDia(numeroDia: number): void {
    const dias = Array.from(
      document.querySelectorAll<HTMLSpanElement>(
        '.flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)'
      )
    );
    const dia = dias.find((el) => el.textContent?.trim() === String(numeroDia));
    dia?.click();
  }

  afterEach(() => {
    // flatpickr inyecta su popup como hijo de <body>; limpiarlo entre tests
    // para que no se acumulen ni interfieran con el siguiente `elegirDia`.
    document.querySelectorAll('.flatpickr-calendar').forEach((el) => el.remove());
  });

  it('renderiza la etiqueta asociada al campo', () => {
    const fixture = createFixture({ label: 'Fecha de actividad' });

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.textContent?.trim()).toContain('Fecha de actividad');
    expect(label.getAttribute('for')).toBe(campo(fixture).id);
  });

  it('el campo es de solo lectura: la fecha se elige únicamente desde el calendario', () => {
    const fixture = createFixture();

    expect(campo(fixture).readOnly).toBe(true);
  });

  it('muestra value() formateado como dd/mm/aaaa', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue(new Date(Date.UTC(2026, 6, 5)));
    fixture.detectChanges();

    expect(campo(fixture).value).toBe('05/07/2026');
  });

  it('abre el calendario de flatpickr al hacer click en el ícono', () => {
    const fixture = createFixture();

    abrirCalendario(fixture);

    expect(calendario()).toBeTruthy();
  });

  it('no abre el calendario cuando el campo está deshabilitado', () => {
    const fixture = createFixture({ disabled: true });

    abrirCalendario(fixture);

    expect(calendario()?.classList.contains('open')).toBeFalsy();
  });

  it('notifica al ControlValueAccessor y actualiza el campo al elegir un día', () => {
    const fixture = createFixture();
    const cambios: (Date | null)[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: Date | null) =>
      cambios.push(valor)
    );
    fixture.debugElement.children[0].componentInstance.writeValue(new Date(Date.UTC(2026, 2, 1)));
    fixture.detectChanges();

    abrirCalendario(fixture);
    elegirDia(15);
    fixture.detectChanges();

    expect(cambios.length).toBe(1);
    expect(cambios[0]?.toISOString().slice(0, 10)).toBe('2026-03-15');
    expect(campo(fixture).value).toBe('15/03/2026');
  });

  it('notifica al ControlValueAccessor que el campo fue tocado al cerrar el calendario', () => {
    const fixture = createFixture();
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));
    fixture.debugElement.children[0].componentInstance.writeValue(new Date(Date.UTC(2026, 2, 1)));
    fixture.detectChanges();

    abrirCalendario(fixture);
    elegirDia(10);

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
