import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ViewChild } from '@angular/core';
import { RadioComponent } from './radio.component';
import { RadioGroupDirective } from './radio-group.directive';

@Component({
  imports: [RadioComponent, RadioGroupDirective],
  template: `
    <div appRadioGroup>
      <app-radio value="a" label="Opción A" />
      <app-radio value="b" label="Opción B" />
    </div>
  `,
})
class HostComponent {
  @ViewChild(RadioGroupDirective) group!: RadioGroupDirective;
}

describe('RadioGroupDirective', () => {
  function createFixture() {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  function radios(fixture: ReturnType<typeof createFixture>): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
  }

  it('expone role="radiogroup" en el elemento host', () => {
    const fixture = createFixture();

    const contenedor: HTMLElement = fixture.nativeElement.querySelector('[appRadioGroup]');
    expect(contenedor.getAttribute('role')).toBe('radiogroup');
  });

  it('writeValue actualiza qué opción aparece marcada', () => {
    const fixture = createFixture();
    fixture.componentInstance.group.writeValue('b');
    fixture.detectChanges();

    const [a, b] = radios(fixture);
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
  });

  it('select() notifica tanto onChange como onTouched', () => {
    const fixture = createFixture();
    const cambios: (string | null)[] = [];
    let tocado = false;
    fixture.componentInstance.group.registerOnChange((valor) => cambios.push(valor));
    fixture.componentInstance.group.registerOnTouched(() => (tocado = true));

    fixture.componentInstance.group.select('a');

    expect(cambios).toEqual(['a']);
    expect(tocado).toBe(true);
  });

  it('setDisabledState deshabilita todas las opciones del grupo', () => {
    const fixture = createFixture();
    fixture.componentInstance.group.setDisabledState(true);
    fixture.detectChanges();

    const [a, b] = radios(fixture);
    expect(a.disabled).toBe(true);
    expect(b.disabled).toBe(true);
  });

  it('genera un name distinto para cada instancia del grupo cuando no se especifica', () => {
    const fixture1 = createFixture();
    TestBed.resetTestingModule();
    const fixture2 = createFixture();

    const nombre1 = radios(fixture1)[0].name;
    const nombre2 = radios(fixture2)[0].name;
    expect(nombre1).not.toBe(nombre2);
  });
});
