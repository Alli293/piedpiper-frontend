import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PasswordInputComponent } from './password-input.component';

@Component({
  imports: [PasswordInputComponent],
  template: `
    <app-password-input [label]="label" [error]="error" [hint]="hint" [required]="required" />
  `,
})
class HostComponent {
  label: string | undefined = 'Contraseña';
  error = '';
  hint = '';
  required = false;
}

describe('PasswordInputComponent', () => {
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

  function boton(fixture: ReturnType<typeof createFixture>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.ch-password-input__toggle');
  }

  it('renderiza el campo como type password por defecto', () => {
    const fixture = createFixture();

    expect(campo(fixture).type).toBe('password');
    expect(boton(fixture).getAttribute('aria-label')).toBe('Mostrar contraseña');
  });

  it('alterna a texto plano al hacer click en el botón de mostrar', () => {
    const fixture = createFixture();

    boton(fixture).click();
    fixture.detectChanges();

    expect(campo(fixture).type).toBe('text');
    expect(boton(fixture).getAttribute('aria-label')).toBe('Ocultar contraseña');
  });

  it('vuelve a ocultar la contraseña al hacer click de nuevo', () => {
    const fixture = createFixture();

    boton(fixture).click();
    fixture.detectChanges();
    boton(fixture).click();
    fixture.detectChanges();

    expect(campo(fixture).type).toBe('password');
  });

  it('actualiza value() y notifica al ControlValueAccessor cuando el usuario escribe', () => {
    const fixture = createFixture();
    const cambios: string[] = [];
    fixture.debugElement.children[0].componentInstance.registerOnChange((valor: string) =>
      cambios.push(valor)
    );

    const input = campo(fixture);
    input.value = 'Clave1234.';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(cambios).toEqual(['Clave1234.']);
  });

  it('notifica al ControlValueAccessor cuando el foco sale del wrapper', () => {
    const fixture = createFixture();
    let tocado = false;
    fixture.debugElement.children[0].componentInstance.registerOnTouched(() => (tocado = true));

    const wrapper: HTMLElement = fixture.nativeElement.querySelector('.ch-password-input__wrapper');
    wrapper.dispatchEvent(new Event('focusout'));

    expect(tocado).toBe(true);
  });

  it('writeValue actualiza el valor mostrado', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.writeValue('valor externo');
    fixture.detectChanges();

    expect(campo(fixture).value).toBe('valor externo');
  });

  it('deshabilita el campo interno cuando el formulario lo marca vía setDisabledState', () => {
    const fixture = createFixture();
    fixture.debugElement.children[0].componentInstance.setDisabledState(true);
    fixture.detectChanges();

    expect(campo(fixture).disabled).toBe(true);
  });

  it('propaga el mensaje de error al campo interno', () => {
    const fixture = createFixture({ error: 'Contraseña muy corta' });

    expect(fixture.nativeElement.querySelector('.ch-text-input__error')?.textContent).toBe(
      'Contraseña muy corta'
    );
  });
});
