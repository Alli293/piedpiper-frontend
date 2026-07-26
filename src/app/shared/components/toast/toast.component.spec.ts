import { TestBed } from '@angular/core/testing';
import { ToastHostComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';

describe('ToastHostComponent', () => {
  let toastService: ToastService;

  function createFixture() {
    const fixture = TestBed.configureTestingModule({
      imports: [ToastHostComponent],
    }).createComponent(ToastHostComponent);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
    return fixture;
  }

  it('no renderiza toasts cuando no hay ninguno activo', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('.ch-toast')).toBeNull();
  });

  it('renderiza un toast de éxito con su título y descripción', () => {
    const fixture = createFixture();
    toastService.success('Guardado', 'Los cambios se guardaron correctamente.');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const toast = root.querySelector('.ch-toast');
    expect(toast?.classList.contains('ch-toast--error')).toBe(false);
    expect(root.querySelector('.ch-toast__title')?.textContent).toBe('Guardado');
    expect(root.querySelector('.ch-toast__description')?.textContent).toBe(
      'Los cambios se guardaron correctamente.'
    );
  });

  it('renderiza un toast de error con la clase correspondiente', () => {
    const fixture = createFixture();
    toastService.error('No se pudo guardar');
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.ch-toast');
    expect(toast?.classList.contains('ch-toast--error')).toBe(true);
  });

  it('no renderiza descripción cuando el toast no tiene una', () => {
    const fixture = createFixture();
    toastService.success('Guardado');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ch-toast__description')).toBeNull();
  });

  it('renderiza varios toasts simultáneamente', () => {
    const fixture = createFixture();
    toastService.success('Primero');
    toastService.error('Segundo');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.ch-toast').length).toBe(2);
  });

  it('descarta el toast al hacer click en el botón de cerrar', () => {
    const fixture = createFixture();
    toastService.success('Guardado');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('.ch-toast__close')!.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ch-toast')).toBeNull();
  });
});
