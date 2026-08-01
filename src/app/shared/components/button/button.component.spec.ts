import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;

  function boton(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.ch-button__inner'
    )!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(ButtonComponent);
    fixture.detectChanges();
  });

  it('reenvia ariaLabel al boton interno y no al host', () => {
    fixture.componentRef.setInput('ariaLabel', 'Asignar a Ana Mora');
    fixture.detectChanges();

    expect(boton().getAttribute('aria-label')).toBe('Asignar a Ana Mora');
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-label')).toBeNull();
  });

  it('no deja un aria-label vacio cuando no se le pasa ninguno', () => {
    expect(boton().hasAttribute('aria-label')).toBe(false);
  });

  it('deshabilita el boton interno mientras carga y lo marca como ocupado', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(boton().disabled).toBe(true);
    expect(boton().getAttribute('aria-busy')).toBe('true');
  });

  it('no marca aria-busy cuando no esta cargando', () => {
    expect(boton().hasAttribute('aria-busy')).toBe(false);
  });

  it('respeta el tipo indicado para poder enviar formularios', () => {
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();

    expect(boton().type).toBe('submit');
  });
});
