import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChipOption, ChipSelectComponent } from './chip-select.component';

const OPCIONES: ChipOption[] = [
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'flota', label: 'Flota' },
  { value: 'vuelos', label: 'Vuelos' },
];

@Component({
  imports: [ChipSelectComponent],
  template: `
    <app-chip-select
      [label]="label"
      [options]="options"
      [multiple]="multiple"
      [error]="error"
      [hint]="hint"
      [disabled]="disabled"
    />
  `,
})
class HostComponent {
  label: string | undefined = 'Categoría';
  options = OPCIONES;
  multiple = false;
  error = '';
  hint = '';
  disabled = false;
}

describe('ChipSelectComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  function chips(fixture: ReturnType<typeof createFixture>): HTMLButtonElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '.ch-chip-select__item'
      )
    );
  }

  it('renderiza un chip por cada opción', () => {
    const fixture = createFixture();

    expect(chips(fixture).map((c) => c.textContent?.trim())).toEqual([
      'Electricidad',
      'Flota',
      'Vuelos',
    ]);
  });

  it('modo único: selecciona un solo chip a la vez y notifica al ControlValueAccessor', () => {
    const fixture = createFixture();
    const cambios: (string | string[])[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange(
      (valor: string | string[]) => cambios.push(valor)
    );

    chips(fixture)[1].click();
    fixture.detectChanges();

    expect(cambios).toEqual(['flota']);
    expect(chips(fixture)[1].classList.contains('ch-chip-select__item--active')).toBe(true);
    expect(chips(fixture)[0].classList.contains('ch-chip-select__item--active')).toBe(false);
  });

  it('modo único: seleccionar otro chip reemplaza la selección anterior', () => {
    const fixture = createFixture();

    chips(fixture)[0].click();
    fixture.detectChanges();
    chips(fixture)[2].click();
    fixture.detectChanges();

    expect(chips(fixture)[0].classList.contains('ch-chip-select__item--active')).toBe(false);
    expect(chips(fixture)[2].classList.contains('ch-chip-select__item--active')).toBe(true);
  });

  it('modo múltiple: acumula selecciones', () => {
    const fixture = createFixture({ multiple: true });
    const cambios: (string | string[])[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange(
      (valor: string | string[]) => cambios.push(valor)
    );

    chips(fixture)[0].click();
    fixture.detectChanges();
    chips(fixture)[2].click();
    fixture.detectChanges();

    expect(cambios).toEqual([['electricidad'], ['electricidad', 'vuelos']]);
    expect(chips(fixture)[0].classList.contains('ch-chip-select__item--active')).toBe(true);
    expect(chips(fixture)[2].classList.contains('ch-chip-select__item--active')).toBe(true);
  });

  it('modo múltiple: hacer click de nuevo en un chip activo lo deselecciona', () => {
    const fixture = createFixture({ multiple: true });

    chips(fixture)[0].click();
    fixture.detectChanges();
    chips(fixture)[0].click();
    fixture.detectChanges();

    expect(chips(fixture)[0].classList.contains('ch-chip-select__item--active')).toBe(false);
  });

  it('notifica al ControlValueAccessor al tocar cualquier chip', () => {
    const fixture = createFixture();
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));

    chips(fixture)[0].click();

    expect(tocado).toBe(true);
  });

  it('writeValue actualiza qué chip aparece activo', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue('vuelos');
    fixture.detectChanges();

    expect(chips(fixture)[2].classList.contains('ch-chip-select__item--active')).toBe(true);
  });

  it('muestra el mensaje de error cuando error() no está vacío', () => {
    const fixture = createFixture({ error: 'Selecciona al menos una categoría' });

    expect(fixture.nativeElement.querySelector('.ch-chip-select__error')?.textContent).toBe(
      'Selecciona al menos una categoría'
    );
  });

  it('deshabilita los chips cuando disabled() es true y no responden al click', () => {
    const fixture = createFixture({ disabled: true });

    expect(chips(fixture)[0].disabled).toBe(true);

    chips(fixture)[0].click();
    fixture.detectChanges();

    expect(chips(fixture)[0].classList.contains('ch-chip-select__item--active')).toBe(false);
  });

  it('deshabilita los chips cuando el formulario lo marca vía setDisabledState', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect(chips(fixture)[0].disabled).toBe(true);
  });
});
