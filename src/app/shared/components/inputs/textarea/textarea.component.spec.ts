import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TextareaComponent } from './textarea.component';

@Component({
  imports: [TextareaComponent],
  template: `
    <app-textarea
      [label]="label"
      [placeholder]="placeholder"
      [rows]="rows"
      [error]="error"
      [hint]="hint"
      [disabled]="disabled"
    />
  `,
})
class HostComponent {
  label: string | undefined = 'Descripción';
  placeholder = '';
  rows = 4;
  error = '';
  hint = '';
  disabled = false;
}

describe('TextareaComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  function textarea(fixture: ReturnType<typeof createFixture>): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('textarea');
  }

  it('renderiza la etiqueta asociada al campo', () => {
    const fixture = createFixture({ label: 'Descripción' });

    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label.textContent?.trim()).toBe('Descripción');
    expect(label.getAttribute('for')).toBe(textarea(fixture).id);
  });

  it('no renderiza etiqueta cuando label() es undefined', () => {
    const fixture = createFixture({ label: undefined });

    expect(fixture.nativeElement.querySelector('label')).toBeNull();
  });

  it('aplica rows() al elemento nativo', () => {
    const fixture = createFixture({ rows: 8 });

    expect(textarea(fixture).rows).toBe(8);
  });

  it('actualiza value() y notifica al ControlValueAccessor cuando el usuario escribe', () => {
    const fixture = createFixture();
    const cambios: string[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: string) =>
      cambios.push(valor)
    );

    const campo = textarea(fixture);
    campo.value = 'Texto largo';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(cambios).toEqual(['Texto largo']);
  });

  it('notifica al ControlValueAccessor cuando el campo pierde el foco', () => {
    const fixture = createFixture();
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));

    textarea(fixture).dispatchEvent(new Event('blur'));

    expect(tocado).toBe(true);
  });

  it('writeValue actualiza el valor mostrado', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue('valor externo');
    fixture.detectChanges();

    expect(textarea(fixture).value).toBe('valor externo');
  });

  it('muestra el mensaje de error y marca aria-invalid cuando error() no está vacío', () => {
    const fixture = createFixture({ error: 'Máximo 500 caracteres' });

    const mensaje = fixture.nativeElement.querySelector('.ch-textarea__error');
    expect(mensaje?.textContent).toBe('Máximo 500 caracteres');
    expect(textarea(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('muestra el hint solo cuando no hay error', () => {
    const fixture = createFixture({ hint: 'Cuéntanos brevemente' });

    expect(fixture.nativeElement.querySelector('.ch-textarea__hint')?.textContent).toBe(
      'Cuéntanos brevemente'
    );
  });

  it('deshabilita el campo cuando disabled() es true', () => {
    const fixture = createFixture({ disabled: true });

    expect(textarea(fixture).disabled).toBe(true);
  });

  it('deshabilita el campo cuando el formulario lo marca vía setDisabledState', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect(textarea(fixture).disabled).toBe(true);
  });
});
