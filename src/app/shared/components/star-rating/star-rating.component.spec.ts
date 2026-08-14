import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

@Component({
  imports: [StarRatingComponent],
  template: `<app-star-rating [(value)]="value" [readonly]="readonly" />`,
})
class HostComponent {
  value: number | null = null;
  readonly = false;
}

describe('StarRatingComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  function getStarButtons(fixture: ReturnType<typeof createFixture>): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.ch-star-rating__star')
    ) as HTMLButtonElement[];
  }

  it('renderiza 5 botones de estrella', () => {
    const fixture = createFixture();
    expect(getStarButtons(fixture)).toHaveLength(5);
  });

  it('todas las estrellas están vacías cuando value es null', () => {
    const fixture = createFixture({ value: null });
    const stars = getStarButtons(fixture);
    const filled = stars.filter((s) => s.classList.contains('ch-star-rating__star--filled'));
    expect(filled).toHaveLength(0);
  });

  it('marca estrellas como filled hasta el valor seleccionado', () => {
    const fixture = createFixture({ value: 3 });
    const stars = getStarButtons(fixture);
    const filled = stars.filter((s) => s.classList.contains('ch-star-rating__star--filled'));
    expect(filled).toHaveLength(3);
  });

  it('actualiza el valor al hacer clic en una estrella', () => {
    const fixture = createFixture();
    const stars = getStarButtons(fixture);
    stars[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(3);
  });

  it('no actualiza el valor si readonly es true', () => {
    const fixture = createFixture({ readonly: true });
    const stars = getStarButtons(fixture);
    stars[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBeNull();
  });

  it('cada estrella tiene role="radio"', () => {
    const fixture = createFixture();
    const stars = getStarButtons(fixture);
    stars.forEach((star) => {
      expect(star.getAttribute('role')).toBe('radio');
    });
  });

  it('el host tiene role="radiogroup"', () => {
    const fixture = createFixture();
    const host: HTMLElement = fixture.nativeElement.querySelector('app-star-rating');
    expect(host.getAttribute('role')).toBe('radiogroup');
  });

  it('cada estrella tiene aria-label descriptivo', () => {
    const fixture = createFixture();
    const stars = getStarButtons(fixture);
    expect(stars[0].getAttribute('aria-label')).toBe('1 de 5 estrellas');
    expect(stars[4].getAttribute('aria-label')).toBe('5 de 5 estrellas');
  });

  it('aria-checked refleja la estrella seleccionada', () => {
    const fixture = createFixture({ value: 4 });
    const stars = getStarButtons(fixture);
    expect(stars[3].getAttribute('aria-checked')).toBe('true');
    expect(stars[0].getAttribute('aria-checked')).toBe('false');
  });

  it('ArrowRight avanza al siguiente valor', () => {
    const fixture = createFixture({ value: 2 });
    const stars = getStarButtons(fixture);
    stars[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(3);
  });

  it('ArrowLeft retrocede al valor anterior', () => {
    const fixture = createFixture({ value: 3 });
    const stars = getStarButtons(fixture);
    stars[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(2);
  });

  it('ArrowRight en la última estrella vuelve a la primera', () => {
    const fixture = createFixture({ value: 5 });
    const stars = getStarButtons(fixture);
    stars[4].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(1);
  });

  it('ArrowLeft en la primera estrella vuelve a la última', () => {
    const fixture = createFixture({ value: 1 });
    const stars = getStarButtons(fixture);
    stars[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe(5);
  });

  it('las estrellas están deshabilitadas cuando readonly es true', () => {
    const fixture = createFixture({ readonly: true });
    const stars = getStarButtons(fixture);
    stars.forEach((star) => {
      expect(star.disabled).toBe(true);
    });
  });
});
