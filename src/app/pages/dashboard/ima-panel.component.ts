import { Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { ImaResponse } from './ima.service';

@Component({
  selector: 'app-ima-panel',
  standalone: true,
  imports: [DecimalPipe, SelectInputComponent, HeadingComponent],
  templateUrl: './ima-panel.component.html',
  styleUrl: './ima-panel.component.scss',
})
export class ImaPanelComponent {
  readonly ima = input<ImaResponse | null>(null);
  readonly loading = input(false);
  readonly anio = input(new Date().getFullYear());
  readonly mes = input(new Date().getMonth() + 1);

  readonly periodoChange = output<{ anio: number; mes: number }>();

  protected readonly String = String;

  protected readonly mesesOptions = computed<SelectOption[]>(() => [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]);

  protected readonly donutDasharray = computed(() => {
    const data = this.ima();
    if (!data) return '0, 100';
    const circumference = 2 * Math.PI * 54;
    return `${(data.ima / 100) * circumference}, ${circumference}`;
  });

  protected readonly formulaText = computed(() => {
    const data = this.ima();
    if (!data) return '';
    if (data.puntajeIntensidadSectorial !== null) {
      return `(${Math.round(data.cobertura)} + ${Math.round(data.puntajeIntensidadSectorial)} + ${Math.round(data.consistencia)}) ÷ 3`;
    }
    return `(${Math.round(data.cobertura)} + ${Math.round(data.consistencia)}) ÷ 2`;
  });

  protected onMesChange(valor: string): void {
    const mesNuevo = Number(valor);
    this.periodoChange.emit({ anio: this.anio(), mes: mesNuevo });
  }
}
