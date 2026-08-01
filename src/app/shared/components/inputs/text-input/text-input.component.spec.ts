import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TextInputComponent, TextInputType } from './text-input.component';

@Component({
  imports: [TextInputComponent],
  template: `
    <app-text-input
      [label]="label"
      [placeholder]="placeholder"
      [type]="type"
      [error]="error"
      [hint]="hint"
      [disabled]="disabled"
      [required]="required"
    />
  `,
})
class HostComponent {
  label: string | undefined = 'Correo';
  placeholder = '';
  type: TextInputType = 'text';
  error = '';
  hint = '';
  disabled = false;
  required = false;
}

describe('TextInputComponent', () => {
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

  it('renderiza la etiqueta asociada al campo', () => {
    const fixture = createFixture({ label: 'Correo' });

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.textContent?.trim()).toContain('Correo');
    expect(label.getAttribute('for')).toBe(input(fixture).id);
  });

  it('no renderiza etiqueta cuando label() es undefined', () => {
    const fixture = createFixture({ label: undefined });

    expect(fixture.nativeElement.querySelector('label')).toBeNull();
  });

  it('agrega un asterisco cuando required() es true', () => {
    const fixture = createFixture({ required: true });

    expect(fixture.nativeElement.querySelector('label')?.textContent).toContain('*');
  });

  it('aplica el type recibido al input nativo', () => {
    const fixture = createFixture({ type: 'email' });

    expect(input(fixture).type).toBe('email');
  });

  it('actualiza value() y notifica al ControlValueAccessor cuando el usuario escribe', () => {
    const fixture = createFixture();
    const cambios: string[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: string) =>
      cambios.push(valor)
    );

    const campo = input(fixture);
    campo.value = 'ana@correo.com';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(cambios).toEqual(['ana@correo.com']);
    expect(campo.value).toBe('ana@correo.com');
  });

  it('notifica al ControlValueAccessor cuando el campo pierde el foco', () => {
    const fixture = createFixture();
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));

    input(fixture).dispatchEvent(new Event('blur'));

    expect(tocado).toBe(true);
  });

  it('writeValue actualiza el valor mostrado en el input', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue('valor externo');
    fixture.detectChanges();

    expect(input(fixture).value).toBe('valor externo');
  });

  it('muestra el mensaje de error y marca aria-invalid cuando error() no está vacío', () => {
    const fixture = createFixture({ error: 'Correo inválido' });

    const mensaje = fixture.nativeElement.querySelector('.ch-text-input__error');
    expect(mensaje?.textContent).toBe('Correo inválido');
    expect(input(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('muestra el hint solo cuando no hay error', () => {
    const fixture = createFixture({ hint: 'Usa tu correo laboral' });

    expect(fixture.nativeElement.querySelector('.ch-text-input__hint')?.textContent).toBe(
      'Usa tu correo laboral'
    );
  });

  it('prioriza el error sobre el hint cuando ambos están presentes', () => {
    const fixture = createFixture({ error: 'Correo inválido', hint: 'Usa tu correo laboral' });

    expect(fixture.nativeElement.querySelector('.ch-text-input__error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ch-text-input__hint')).toBeNull();
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

  it('genera ids únicos entre instancias distintas cuando no se recibe id()', () => {
    const fixture1 = createFixture();
    TestBed.resetTestingModule();
    const fixture2 = createFixture();

    expect(input(fixture1).id).not.toBe(input(fixture2).id);
  });
});
