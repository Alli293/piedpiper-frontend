import { Component, input, output } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

export interface FilterChip {
  id: string;
  label: string;
  icon?: IconName;
  count?: number;
}

@Component({
  selector: 'app-filter-chips',
  imports: [IconComponent],
  templateUrl: './filter-chips.component.html',
  styleUrl: './filter-chips.component.scss',
  host: {
    class: 'ch-filter-chips',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class FilterChipsComponent {
  chips = input.required<FilterChip[]>();
  activeId = input.required<string>();
  ariaLabel = input('Filtros');

  chipSelected = output<string>();

  protected select(chip: FilterChip): void {
    this.chipSelected.emit(chip.id);
  }
}
