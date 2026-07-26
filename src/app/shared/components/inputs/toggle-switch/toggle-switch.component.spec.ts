import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToggleSwitchComponent } from './toggle-switch.component';

@Component({
  imports: [ToggleSwitchComponent],
  template: `
    <app-toggle-switch [checked]="checked" [disabled]="disabled" [label]="label" [error]="error" />
  `,
})
class HostComponent {
  checked = false;
  disabled = false;
  label = 'Recibir notificaciones';
  error = '';
}

describe('ToggleSwitchComponent', () => {
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
    const fixture = createFixture({ label: 'Recibir notificaciones' });

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.textContent?.trim()).toBe('Recibir notificaciones');
    expect(label.getAttribute('for')).toBe(input(fixture).id);
  });

  it('refleja checked() en el input nativo', () => {
    const fixture = createFixture({ checked: true });

    expect(input(fixture).checked).toBe(true);
  });

  it('actualiza checked() y notifica al ControlValueAccessor al cambiar', () => {
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

  it('muestra el mensaje de error cuando error() no está vacío', () => {
    const fixture = createFixture({ error: 'Debes elegir una opción' });

    expect(fixture.nativeElement.querySelector('.ch-toggle-switch__error')?.textContent).toBe(
      'Debes elegir una opción'
    );
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
