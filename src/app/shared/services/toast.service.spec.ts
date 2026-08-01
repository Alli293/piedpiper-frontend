import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('empieza sin toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('success() agrega un toast con variante success', () => {
    service.success('Guardado', 'Los cambios se guardaron correctamente.');

    expect(service.toasts()).toEqual([
      {
        id: expect.any(Number),
        variant: 'success',
        title: 'Guardado',
        description: 'Los cambios se guardaron correctamente.',
      },
    ]);
  });

  it('error() agrega un toast con variante error', () => {
    service.error('No se pudo guardar');

    expect(service.toasts()[0]).toMatchObject({
      variant: 'error',
      title: 'No se pudo guardar',
    });
  });

  it('asigna ids únicos e incrementales a cada toast', () => {
    service.success('Primero');
    service.success('Segundo');

    const [primero, segundo] = service.toasts();
    expect(segundo.id).toBeGreaterThan(primero.id);
  });

  it('dismiss() elimina solo el toast indicado', () => {
    const id1 = service.show({ variant: 'success', title: 'Uno' });
    const id2 = service.show({ variant: 'success', title: 'Dos' });

    service.dismiss(id1);

    expect(service.toasts().map((t) => t.id)).toEqual([id2]);
  });

  it('descarta automáticamente el toast tras la duración por defecto', () => {
    service.success('Guardado');
    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(8000);

    expect(service.toasts().length).toBe(0);
  });

  it('respeta una duración personalizada', () => {
    service.show({ variant: 'success', title: 'Uno' }, 2000);

    vi.advanceTimersByTime(1999);
    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(1);
    expect(service.toasts().length).toBe(0);
  });
});
