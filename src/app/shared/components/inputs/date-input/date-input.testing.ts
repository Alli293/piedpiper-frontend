import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DateInputComponent } from './date-input.component';

/**
 * Selecciona una fecha en un `app-date-input` dentro de un fixture,
 * disparando el mismo camino que un click real en el calendario (onChange de
 * flatpickr -> ControlValueAccessor -> Signal Forms).
 *
 * `app-date-input` ya no es un `<input type="date">` editable: es de solo
 * lectura y el calendario se abre fuera del árbol del componente, así que
 * `element.value = '...'` + `dispatchEvent(new Event('input'))` (el patrón
 * usado para el resto de los inputs) no funciona con él. Usar este helper en
 * su lugar.
 *
 * @param selector CSS opcional para desambiguar cuando hay más de un
 *   `app-date-input` en la misma página (p. ej. un formulario con varios
 *   campos de fecha condicionales).
 */
export function seleccionarFechaDeInput(
  fixture: ComponentFixture<unknown>,
  fecha: Date,
  selector?: string
): void {
  const raiz = selector ? fixture.debugElement.query(By.css(selector)) : fixture.debugElement;
  if (!raiz) {
    throw new Error(`No se encontró el contenedor para el selector: ${selector}`);
  }

  const dateInput = raiz.query(By.directive(DateInputComponent));
  if (!dateInput) {
    throw new Error(
      'No se encontró ningún app-date-input en el fixture (o dentro del selector dado).'
    );
  }

  (dateInput.componentInstance as DateInputComponent).seleccionarFechaParaPruebas(fecha);
  fixture.detectChanges();
}
