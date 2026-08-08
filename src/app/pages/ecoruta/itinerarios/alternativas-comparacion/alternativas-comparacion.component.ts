import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AlternativaDTO } from '../models/alternativas.model';

@Component({
  selector: 'app-alternativas-comparacion',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './alternativas-comparacion.component.html',
  styleUrl: './alternativas-comparacion.component.scss',
})
export class AlternativasComparacionComponent {
  alternativas = input.required<AlternativaDTO[]>();
  actividadOriginal = input.required<{ nombre: string; ecoScore: number }>();
  cargando = input<boolean>(false);

  reemplazar = output<AlternativaDTO>();

  protected onReemplazar(alternativa: AlternativaDTO): void {
    this.reemplazar.emit(alternativa);
  }

  protected getMejorAlternativa(): AlternativaDTO | undefined {
    return this.alternativas().find((a) => a.mejorDesempeno);
  }
}
