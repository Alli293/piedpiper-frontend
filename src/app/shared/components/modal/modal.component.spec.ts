import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

@Component({
  imports: [ModalComponent],
  template: `
    @if (abierto()) {
      <app-modal label="Confirmar acción" (close)="onClose()">
        <p>Contenido de prueba</p>
        <button type="button">Primero</button>
        <button type="button">Último</button>
      </app-modal>
    }
  `,
})
class HostComponent {
  cerrado = 0;
  readonly abierto = signal(true);

  onClose(): void {
    this.cerrado++;
  }
}

@Component({
  imports: [ModalComponent],
  template: `
    <h2 id="titulo-modal">Confirmar acción</h2>
    <app-modal labelledBy="titulo-modal" (close)="onClose()">
      <p>Contenido de prueba</p>
    </app-modal>
  `,
})
class HostConLabelledByComponent {
  onClose(): void {}
}

@Component({
  imports: [ModalComponent],
  template: `
    <button type="button" (click)="abierto.set(true)">Abrir</button>
    @if (abierto()) {
      <app-modal label="Confirmar acción" (close)="abierto.set(false)">
        <p>Contenido de prueba</p>
      </app-modal>
    }
  `,
})
class HostConDisparadorComponent {
  readonly abierto = signal(false);
}

describe('ModalComponent', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

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

  it('usa aria-labelledby y omite aria-label cuando se provee labelledBy', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostConLabelledByComponent],
    }).createComponent(HostConLabelledByComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-labelledby')).toBe('titulo-modal');
    expect(dialog.getAttribute('aria-label')).toBeNull();
  });

  it('bloquea el scroll del body mientras está abierto y lo restaura al cerrarse', async () => {
    const fixture = await createFixture();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentInstance.abierto.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.body.style.overflow).toBe('');
  });

  it('devuelve el foco al disparador al cerrarse', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostConDisparadorComponent],
    }).createComponent(HostConDisparadorComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const disparador: HTMLElement = fixture.nativeElement.querySelector('button');
    disparador.focus();
    disparador.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(document.activeElement).toBe(dialog);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(disparador);
  });
});
