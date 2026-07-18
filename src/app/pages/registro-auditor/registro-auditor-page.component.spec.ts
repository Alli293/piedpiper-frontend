import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { RegistroAuditorPageComponent } from './registro-auditor-page.component';
import { environment } from '../../../environments/environment';

describe('RegistroAuditorPageComponent', () => {
  let component: RegistroAuditorPageComponent;
  let fixture: ComponentFixture<RegistroAuditorPageComponent>;
  let httpMock: HttpTestingController;
  let storage: Storage;
  const base = `${environment.apiBaseUrl}/auth`;

  beforeEach(async () => {
    storage = createStorageMock();
    vi.stubGlobal('localStorage', storage);

    await TestBed.configureTestingModule({
      imports: [RegistroAuditorPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroAuditorPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when submitting with empty fields', async () => {
    // Trigger submit
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    // Check that error messages appear
    const errors = fixture.nativeElement.querySelectorAll('[role="alert"], .ch-text-input__error');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should show email error on 409 response', async () => {
    // Set valid form values
    component['model'].update((m: any) => ({
      ...m,
      nombre: 'Carlos',
      apellidos: 'Lopez',
      email: 'carlos@example.com',
      contrasena: 'segura123',
      confirmarContrasena: 'segura123',
      aceptaTerminos: true,
    }));
    fixture.detectChanges();

    // Submit
    component['enviar']();
    await fixture.whenStable();
    fixture.detectChanges();

    // Mock 409 response
    const req = httpMock.expectOne(`${base}/registro/auditor/correo`);
    req.flush(
      { message: 'Ya existe una cuenta con este correo.' },
      { status: 409, statusText: 'Conflict' }
    );
    fixture.detectChanges();

    expect(component['errorEmail']()).toContain('Ya existe');
  });
});

function createStorageMock(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}
