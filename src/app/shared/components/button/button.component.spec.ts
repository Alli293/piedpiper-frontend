import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonComponent, ButtonSize, ButtonVariant } from './button.component';

@Component({
  imports: [ButtonComponent],
  template: `
    <app-button
      [id]="id"
      [variant]="variant"
      [size]="size"
      [disabled]="disabled"
      [loading]="loading"
      [type]="type"
      [ariaLabel]="ariaLabel"
    >
      Continuar
    </app-button>
  `,
})
class HostComponent {
  id: string | undefined;
  variant: ButtonVariant = 'primary';
  size: ButtonSize = 'md';
  disabled = false;
  loading = false;
  type: 'button' | 'submit' | 'reset' = 'button';
  ariaLabel: string | undefined;
}

describe('ButtonComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('aplica las clases de variante y tamaño por defecto en el host', () => {
    const fixture = createFixture();

    const host: HTMLElement = fixture.nativeElement.querySelector('app-button');
    expect(host.classList.contains('ch-button')).toBe(true);
    expect(host.classList.contains('ch-button--primary')).toBe(true);
    expect(host.classList.contains('ch-button--md')).toBe(true);
  });

  it('refleja variant() y size() en las clases del host', () => {
    const fixture = createFixture({ variant: 'danger', size: 'lg' });

    const host: HTMLElement = fixture.nativeElement.querySelector('app-button');
    expect(host.classList.contains('ch-button--danger')).toBe(true);
    expect(host.classList.contains('ch-button--lg')).toBe(true);
    expect(host.classList.contains('ch-button--primary')).toBe(false);
    expect(host.classList.contains('ch-button--md')).toBe(false);
  });

  it('proyecta el contenido dentro del botón', () => {
    const fixture = createFixture();

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.textContent?.trim()).toBe('Continuar');
  });

  it('aplica el atributo type recibido', () => {
    const fixture = createFixture({ type: 'submit' });

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.type).toBe('submit');
  });

  it('deshabilita el botón cuando disabled() es true', () => {
    const fixture = createFixture({ disabled: true });

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.disabled).toBe(true);
  });

  it('deshabilita el botón cuando loading() es true, aunque disabled() sea false', () => {
    const fixture = createFixture({ loading: true });

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.disabled).toBe(true);
    expect(boton.getAttribute('aria-busy')).toBe('true');
  });

  it('muestra el spinner y oculta la etiqueta mientras loading() es true', () => {
    const fixture = createFixture({ loading: true });

    const spinner = fixture.nativeElement.querySelector('.ch-button__spinner');
    const label: HTMLElement = fixture.nativeElement.querySelector('.ch-button__label');
    expect(spinner).toBeTruthy();
    expect(label.style.visibility).toBe('hidden');
  });

  it('no muestra el spinner cuando loading() es false', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('.ch-button__spinner')).toBeNull();
  });

  it('asigna id() al botón interno, no al host', () => {
    const fixture = createFixture({ id: 'btn-guardar' });

    const host: HTMLElement = fixture.nativeElement.querySelector('app-button');
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.id).toBe('btn-guardar');
    expect(host.hasAttribute('id')).toBe(false);
  });

  it('reenvia ariaLabel() al boton interno, no al host', () => {
    const fixture = createFixture({ ariaLabel: 'Asignar a Ana Mora' });

    const host: HTMLElement = fixture.nativeElement.querySelector('app-button');
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.getAttribute('aria-label')).toBe('Asignar a Ana Mora');
    expect(host.hasAttribute('aria-label')).toBe(false);
  });

  it('no deja un aria-label vacio cuando no se pasa ninguno', () => {
    const fixture = createFixture();

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.hasAttribute('aria-label')).toBe(false);
  });
});
