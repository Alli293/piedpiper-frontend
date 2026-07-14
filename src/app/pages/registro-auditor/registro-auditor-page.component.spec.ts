import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegistroAuditorPageComponent } from './registro-auditor-page.component';
import { environment } from '../../../environments/environment';

describe('RegistroAuditorPageComponent', () => {
  let component: RegistroAuditorPageComponent;
  let fixture: ComponentFixture<RegistroAuditorPageComponent>;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/auth`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroAuditorPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroAuditorPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when submitting with empty fields', () => {
    // Trigger submit
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // Check that error messages appear
    const errors = fixture.nativeElement.querySelectorAll('[role="alert"], .ch-text-input__error');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should show email error on 409 response', () => {
    // Set valid form values
    component['nombre'].set('Carlos');
    component['apellidos'].set('Lopez');
    component['email'].set('carlos@example.com');
    component['contrasena'].set('segura123');
    component['confirmarContrasena'].set('segura123');
    component['aceptaTerminos'].set(true);
    fixture.detectChanges();

    // Submit
    component['enviar']();
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
