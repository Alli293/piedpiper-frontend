import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

export type ModalSize = 'sm' | 'md';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  readonly label = input.required<string>();
  readonly size = input<ModalSize>('sm');

  readonly close = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');

  constructor() {
    effect(() => {
      this.dialog().nativeElement.focus();
    });
  }

  protected onBackdropClick(): void {
    this.close.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusables = this.dialog().nativeElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) {
      return;
    }
    const primero = focusables[0];
    const ultimo = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }
}
