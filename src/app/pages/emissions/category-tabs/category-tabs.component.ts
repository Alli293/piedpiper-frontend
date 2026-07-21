import { Component, input, output } from '@angular/core';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';

export interface EmissionCategoryTab {
  id: string;
  label: string;
  icon: IconName;
  disabled?: boolean;
  disabledTitle?: string;
}

@Component({
  selector: 'app-emission-category-tabs',
  imports: [IconComponent],
  templateUrl: './category-tabs.component.html',
  styleUrl: './category-tabs.component.scss',
  host: {
    class: 'ch-emission-category-tabs',
    role: 'group',
    'aria-label': 'Categoría de emisión',
  },
})
export class EmissionCategoryTabsComponent {
  tabs = input.required<EmissionCategoryTab[]>();
  activeId = input.required<string>();

  categorySelected = output<string>();

  protected selectTab(tab: EmissionCategoryTab): void {
    if (tab.disabled) return;
    this.categorySelected.emit(tab.id);
  }
}
