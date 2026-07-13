import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { of } from 'rxjs';
import { RegisterEmissionPageComponent } from './register-emission-page.component';
import { EmisionesService } from '../emisiones.service';
import { EmisionResponse } from '../models/emision.model';

const VALID_RESPONSE: EmisionResponse = {
  id: '1',
  categoria: 'ELECTRICIDAD',
  titulo: 'Planta de tueste',
  fechaActividad: '2026-07-01',
  electricityValue: 500,
  electricityUnit: 'kwh',
  carbonKg: 347,
  carbonMt: 0.347,
  factorEmisionId: 'factor-1',
  estimatedAt: '2026-07-01T00:00:00Z',
  createdAt: '2026-07-01T00:00:00Z',
};

describe('RegisterEmissionPageComponent', () => {
  let registrarElectricidad: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    registrarElectricidad = vi.fn();

    await TestBed.configureTestingModule({
      imports: [RegisterEmissionPageComponent],
      providers: [
        provideLocationMocks(),
        { provide: EmisionesService, useValue: { registrarElectricidad } },
      ],
    }).compileComponents();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(RegisterEmissionPageComponent);
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
    setInputValue(root, 'textarea', 'Planta de tueste');
    setInputValue(root, 'app-number-input input', '500');
    setInputValue(root, 'app-date-input input', '2026-07-01');
  }

  async function submitForm(fixture: ReturnType<typeof createFixture>): Promise<void> {
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  it('does not call the service when the amount is 0 (invalid form)', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    setInputValue(root, 'app-number-input input', '0');

    await submitForm(fixture);

    expect(registrarElectricidad).not.toHaveBeenCalled();
  });

  it('calls the service exactly once when the form is valid', async () => {
    registrarElectricidad.mockReturnValue(of(VALID_RESPONSE));

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    await submitForm(fixture);

    expect(registrarElectricidad).toHaveBeenCalledTimes(1);
    expect(registrarElectricidad).toHaveBeenCalledWith({
      titulo: 'Planta de tueste',
      electricityValue: 500,
      electricityUnit: 'kwh',
      fechaActividad: '2026-07-01',
    });
  });
});
