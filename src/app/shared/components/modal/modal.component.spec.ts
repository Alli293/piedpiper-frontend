import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

@Component({
  imports: [ModalComponent],
  template: `
    <app-modal label="Confirmar acción" (close)="onClose()">
      <p>Contenido de prueba</p>
      <button type="button">Primero</button>
      <button type="button">Último</button>
    </app-modal>
  `,
})
class HostComponent {
  cerrado = 0;

  onClose(): void {
    this.cerrado++;
  }
}

describe('ModalComponent', () => {
  async function createFixture() {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renderiza el contenido proyectado y el aria-label', async () => {
    const fixture = await createFixture();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-label')).toBe('Confirmar acción');
    expect(fixture.nativeElement.querySelector('p')?.textContent).toBe('Contenido de prueba');
  });

  it('enfoca el diálogo automáticamente al abrirse', async () => {
    const fixture = await createFixture();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(document.activeElement).toBe(dialog);
  });

  it('emite close al hacer click en el backdrop', async () => {
    const fixture = await createFixture();

    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.ch-modal__backdrop');
    backdrop.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.cerrado).toBe(1);
  });

  it('no emite close al hacer click dentro del diálogo', async () => {
    const fixture = await createFixture();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    dialog.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.cerrado).toBe(0);
  });

  it('emite close al presionar Escape', async () => {
    const fixture = await createFixture();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.cerrado).toBe(1);
  });

  it('atrapa el foco con Tab desde el último elemento hacia el primero', async () => {
    const fixture = await createFixture();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    const botones = fixture.nativeElement.querySelectorAll('button');
    const primero: HTMLElement = botones[0];
    const ultimo: HTMLElement = botones[botones.length - 1];

    ultimo.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    dialog.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(primero);
  });

  it('atrapa el foco con Shift+Tab desde el primer elemento hacia el último', async () => {
    const fixture = await createFixture();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    const botones = fixture.nativeElement.querySelectorAll('button');
    const primero: HTMLElement = botones[0];
    const ultimo: HTMLElement = botones[botones.length - 1];

    primero.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
    dialog.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(ultimo);
  });
});
