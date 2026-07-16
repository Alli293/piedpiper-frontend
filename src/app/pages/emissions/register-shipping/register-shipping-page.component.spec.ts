import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { RegisterShippingPageComponent } from './register-shipping-page.component';
import { EmisionesService } from '../emisiones.service';
import { ToastService } from '../../../shared/services/toast.service';
import { EmisionEnvioResponse } from '../models/emision.model';

const VALID_RESPONSE: EmisionEnvioResponse = {
  id: '1',
  categoria: 'ENVIO',
  titulo: 'Envío de café a puerto',
  fechaActividad: '2026-07-01',
  weightValue: 200,
  weightUnit: 'KG',
  distanceValue: 500,
  distanceUnit: 'km',
  transportMethod: 'TRUCK',
  carbonKg: 35.5,
  carbonMt: 0.036,
  factorEmisionId: 'factor-envio-1',
  estimatedAt: '2026-07-01T00:00:00Z',
  createdAt: '2026-07-01T00:00:00Z',
};

describe('RegisterShippingPageComponent', () => {
  let registrarEnvio: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;
  let toastSuccess: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    registrarEnvio = vi.fn();
    toastError = vi.fn();
    toastSuccess = vi.fn();

    await TestBed.configureTestingModule({
      imports: [RegisterShippingPageComponent],
      providers: [
        provideLocationMocks(),
        provideRouter([]),
        { provide: EmisionesService, useValue: { registrarEnvio } },
        {
          provide: ToastService,
          useValue: {
            toasts: signal([]),
            error: toastError,
            success: toastSuccess,
            show: vi.fn(),
            dismiss: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  function createFixture() {
    const fixture = TestBed.createComponent(RegisterShippingPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function setInputValue(root: HTMLElement, selector: string, value: string): void {
    const element = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  function fillValidForm(root: HTMLElement): void {
    setInputValue(root, 'textarea', 'Envío de café a puerto');

    const numberInputs = root.querySelectorAll<HTMLInputElement>('app-number-input input');
    numberInputs[0].value = '200';
    numberInputs[0].dispatchEvent(new Event('input'));
    numberInputs[1].value = '500';
    numberInputs[1].dispatchEvent(new Event('input'));

    setInputValue(root, 'app-date-input input', '2026-07-01');
  }

  async function submitForm(fixture: ReturnType<typeof createFixture>): Promise<void> {
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not call the service when weight is 0 (invalid form)', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    const numberInputs = root.querySelectorAll<HTMLInputElement>('app-number-input input');
    numberInputs[0].value = '0';
    numberInputs[0].dispatchEvent(new Event('input'));

    await submitForm(fixture);

    expect(registrarEnvio).not.toHaveBeenCalled();
  });

  it('calls the service exactly once when the form is valid', async () => {
    registrarEnvio.mockReturnValue(of(VALID_RESPONSE));

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    await submitForm(fixture);

    expect(registrarEnvio).toHaveBeenCalledTimes(1);
    expect(registrarEnvio).toHaveBeenCalledWith({
      titulo: 'Envío de café a puerto',
      weightValue: 200,
      weightUnit: 'KG',
      distanceValue: 500,
      distanceUnit: 'km',
      transportMethod: 'TRUCK',
      fechaActividad: '2026-07-01',
    });
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/emisiones');
  });

  it('shows session error toast on 401 response', async () => {
    const httpError = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    registrarEnvio.mockReturnValue(throwError(() => httpError));

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    await submitForm(fixture);

    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('sesión'));
    expect(TestBed.inject(Router).navigateByUrl).not.toHaveBeenCalledWith('/emisiones');
  });

  it('shows session error toast on 403 response', async () => {
    const httpError = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
    registrarEnvio.mockReturnValue(throwError(() => httpError));

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    await submitForm(fixture);

    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('sesión'));
  });

  it('shows API error message when backend returns error with message', async () => {
    const httpError = new HttpErrorResponse({
      status: 422,
      statusText: 'Unprocessable Entity',
      error: { status: 422, message: 'El peso excede el limite permitido.' },
    });
    registrarEnvio.mockReturnValue(throwError(() => httpError));

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    await submitForm(fixture);

    expect(toastError).toHaveBeenCalledWith('El peso excede el limite permitido.');
  });

  it('shows generic connection error on unknown failure', async () => {
    registrarEnvio.mockReturnValue(throwError(() => new Error('Network error')));

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    await submitForm(fixture);

    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('No se pudo conectar'));
  });
});
