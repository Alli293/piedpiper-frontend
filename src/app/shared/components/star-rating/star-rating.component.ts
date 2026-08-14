import { Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
  host: {
    class: 'ch-star-rating',
    role: 'radiogroup',
    '[attr.aria-label]': 'ariaGroupLabel()',
  },
})
export class StarRatingComponent {
  /** Valor actual seleccionado (1–5 o null si no hay selección). */
  value = model<number | null>(null);

  /** Si el componente es de solo lectura (no interactivo). */
  readonly = input(false);

  /** Etiqueta del grupo para lectores de pantalla. */
  label = input('Calificación');

  protected readonly stars = [1, 2, 3, 4, 5];

  protected readonly ariaGroupLabel = computed(() => this.label());

  protected readonly highlightIndex = computed(() => {
    const val = this.value();
    return val !== null && val >= 1 && val <= 5 ? val : 0;
  });

  protected isFilled(star: number): boolean {
    return star <= this.highlightIndex();
  }

  protected starAriaLabel(star: number): string {
    return `${star} de 5 estrellas`;
  }

  protected isChecked(star: number): boolean {
    return this.value() === star;
  }

  protected onStarClick(star: number): void {
    if (this.readonly()) return;
    this.value.set(star);
  }

  protected onKeydown(event: KeyboardEvent, currentStar: number): void {
    if (this.readonly()) return;

    let newValue: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        newValue = currentStar < 5 ? currentStar + 1 : 1;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        newValue = currentStar > 1 ? currentStar - 1 : 5;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.value.set(currentStar);
        return;
      default:
        return;
    }

    if (newValue !== null) {
      this.value.set(newValue);
      const nextButton = (event.target as HTMLElement)
        .closest('.ch-star-rating')
        ?.querySelector<HTMLButtonElement>(`[data-star="${newValue}"]`);
      nextButton?.focus();
    }
  }
}
