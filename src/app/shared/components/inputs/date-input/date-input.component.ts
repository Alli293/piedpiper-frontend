import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  model,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { IconComponent } from '../../icon/icon.component';

let nextId = 0;

/**
 * Convierte un Date "UTC medianoche" (la convención del componente, ver
 * `date.utils.ts`) a un Date en medianoche LOCAL con los mismos componentes
 * año/mes/día — que es lo que flatpickr espera para no desfasar el día
 * mostrado según la zona horaria del navegador.
 */
function aFechaLocal(fecha: Date): Date {
  return new Date(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
}

/** Conversión inversa: de la fecha local que entrega flatpickr a UTC medianoche. */
function aFechaUtc(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
}

@Component({
  selector: 'app-date-input',
  imports: [IconComponent],
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.scss',
  host: {
    class: 'ch-text-input',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
})
export class DateInputComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  label = input<string>();
  value = model<Date | null>(null);
  error = input('');
  hint = input('');
  disabled = input(false);
  required = input(false);
  max = input<Date | undefined>();
  min = input<Date | undefined>();

  private readonly fieldRef = viewChild<ElementRef<HTMLInputElement>>('field');
  private picker: flatpickr.Instance | null = null;

  protected readonly inputId = `ch-date-input-${nextId++}`;
  protected readonly hintId = `${this.inputId}-hint`;
  protected readonly errorId = `${this.inputId}-error`;

  protected readonly formDisabled = signal(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly hasError = computed(() => this.error().length > 0);
  protected readonly describedBy = computed(() => {
    if (this.hasError()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Sincroniza cambios posteriores de los inputs con la instancia de
    // flatpickr ya creada. Antes de ngAfterViewInit `picker` es null y estos
    // efectos no hacen nada — el valor inicial ya lo toma la configuración
    // de creación, más abajo.
    effect(() => {
      const fecha = this.value();
      this.picker?.setDate(fecha ? aFechaLocal(fecha) : [], false);
    });
    effect(() => {
      this.picker?.set('maxDate', this.max() ? aFechaLocal(this.max()!) : undefined);
    });
    effect(() => {
      this.picker?.set('minDate', this.min() ? aFechaLocal(this.min()!) : undefined);
    });
    effect(() => {
      this.picker?.set('clickOpens', !this.effectiveDisabled());
    });
  }

  ngAfterViewInit(): void {
    const field = this.fieldRef()?.nativeElement;
    if (!field) return;

    const valorInicial = this.value();

    this.picker = flatpickr(field, {
      locale: Spanish,
      dateFormat: 'd/m/Y',
      allowInput: false,
      clickOpens: !this.effectiveDisabled(),
      defaultDate: valorInicial ? aFechaLocal(valorInicial) : undefined,
      maxDate: this.max() ? aFechaLocal(this.max()!) : undefined,
      minDate: this.min() ? aFechaLocal(this.min()!) : undefined,
      onChange: (selectedDates) => {
        const nuevaFecha = selectedDates[0] ? aFechaUtc(selectedDates[0]) : null;
        this.value.set(nuevaFecha);
        this.onChange(nuevaFecha);
      },
      onClose: () => this.onTouched(),
    });
  }

  ngOnDestroy(): void {
    this.picker?.destroy();
  }

  writeValue(value: Date | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected openPicker(): void {
    this.picker?.open();
  }

  /**
   * Selecciona una fecha disparando exactamente el mismo camino que un click
   * real en el calendario (flatpickr `onChange` -> `ControlValueAccessor` ->
   * Signal Forms). El campo es de solo lectura y el calendario se inyecta
   * fuera del árbol del componente, así que no hay forma de "escribir" una
   * fecha desde un test como con un input nativo — usar este método (a
   * través de `seleccionarFechaDeInput` en `date-input.testing.ts`) en vez
   * de manipular el DOM a mano.
   */
  seleccionarFechaParaPruebas(fecha: Date): void {
    this.picker?.setDate(aFechaLocal(fecha), true);
  }
}
