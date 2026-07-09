import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';

import { RegistroAuditorPageComponent } from './registro-auditor-page.component';

@Component({ template: '', standalone: true })
class DummyComponent {}

describe('RegistroAuditorPageComponent', () => {
  let component: RegistroAuditorPageComponent;
  let fixture: ComponentFixture<RegistroAuditorPageComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroAuditorPageComponent, ReactiveFormsModule],
      providers: [
        provideRouter([
          { path: 'validacion-pendiente', component: DummyComponent },
          { path: 'login', component: DummyComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegistroAuditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Flush the catalog request that fires on init
    const catalogReq = httpTesting.match(
      (req) => req.url.includes('/catalogs/entidades-certificadoras')
    );
    catalogReq.forEach((req) => req.flush([
      { id: 1, nombre: 'Bureau Veritas' },
      { id: 2, nombre: 'SGS' },
      { id: 3, nombre: 'TÜV Rheinland' },
    ]));
    fixture.detectChanges();
  });

  describe('Renderizado inicial', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should start on step 1', () => {
      expect(component.currentStep()).toBe(1);
    });

    it('should have all form controls initialized as empty', () => {
      const form = component.form;
      expect(form.controls.nombre.value).toBe('');
      expect(form.controls.apellidos.value).toBe('');
      expect(form.controls.email.value).toBe('');
      expect(form.controls.contrasena.value).toBe('');
      expect(form.controls.confirmarContrasena.value).toBe('');
      expect(form.controls.numeroCertificacion.value).toBe('');
      expect(form.controls.entidadCertificadora.value).toBe('');
      expect(form.controls.entidadCertificadoraOtra.value).toBe('');
      expect(form.controls.fechaVigenciaCert.value).toBe('');
      expect(form.controls.aniosExperiencia.value).toBeNull();
      expect(form.controls.docCertificadoPdf.value).toBeNull();
      expect(form.controls.docIdentificacionPdf.value).toBeNull();
      expect(form.controls.aceptaTerminos.value).toBe(false);
    });

    it('should not display any error messages initially', () => {
      expect(component.getFieldError('nombre')).toBe('');
      expect(component.getFieldError('apellidos')).toBe('');
      expect(component.getFieldError('email')).toBe('');
      expect(component.getFieldError('contrasena')).toBe('');
      expect(component.getFieldError('confirmarContrasena')).toBe('');
      expect(component.getFieldError('numeroCertificacion')).toBe('');
      expect(component.getFieldError('entidadCertificadora')).toBe('');
      expect(component.getFieldError('fechaVigenciaCert')).toBe('');
      expect(component.getFieldError('aniosExperiencia')).toBe('');
      expect(component.getFieldError('docCertificadoPdf')).toBe('');
      expect(component.getFieldError('docIdentificacionPdf')).toBe('');
    });
  });

  describe('Stepper navigation', () => {
    it('should not advance to step 2 if step 1 fields are invalid', () => {
      component.nextStep();
      expect(component.currentStep()).toBe(1);
    });

    it('should advance to step 2 when step 1 fields are valid', () => {
      fillStep1();
      component.nextStep();
      expect(component.currentStep()).toBe(2);
    });

    it('should go back to step 1 from step 2', () => {
      fillStep1();
      component.nextStep();
      expect(component.currentStep()).toBe(2);
      component.prevStep();
      expect(component.currentStep()).toBe(1);
    });

    it('should advance to step 3 when step 2 fields are valid', () => {
      fillStep1();
      component.nextStep();
      fillStep2();
      component.nextStep();
      expect(component.currentStep()).toBe(3);
    });

    it('should not go below step 1', () => {
      component.prevStep();
      expect(component.currentStep()).toBe(1);
    });
  });

  describe('Validación inline en blur', () => {
    it('should show error for nombre when too short and touched', () => {
      const control = component.form.controls.nombre;
      control.setValue('A');
      control.markAsTouched();
      expect(component.getFieldError('nombre')).toContain('al menos 2 caracteres');
    });

    it('should show error for nombre when pattern is invalid', () => {
      const control = component.form.controls.nombre;
      control.setValue('John123');
      control.markAsTouched();
      expect(component.getFieldError('nombre')).toContain('letras, espacios, acentos y guiones');
    });

    it('should show error for email when format is invalid', () => {
      const control = component.form.controls.email;
      control.setValue('invalid-email');
      control.markAsTouched();
      expect(component.getFieldError('email')).toContain('formato de correo es inválido');
    });

    it('should show error for contrasena when too short', () => {
      const control = component.form.controls.contrasena;
      control.setValue('abc1');
      control.markAsTouched();
      expect(component.getFieldError('contrasena')).toContain('al menos 8 caracteres');
    });

    it('should show error for contrasena when missing digit', () => {
      const control = component.form.controls.contrasena;
      control.setValue('abcdefgh');
      control.markAsTouched();
      expect(component.getFieldError('contrasena')).toContain('al menos 1 letra y 1 número');
    });

    it('should show error for confirmarContrasena when passwords do not match', () => {
      component.form.controls.contrasena.setValue('Password1');
      const control = component.form.controls.confirmarContrasena;
      control.setValue('DifferentPass1');
      control.markAsTouched();
      expect(component.getFieldError('confirmarContrasena')).toContain('no coinciden');
    });

    it('should show error for numeroCertificacion with invalid characters', () => {
      const control = component.form.controls.numeroCertificacion;
      control.setValue('ABC!@#');
      control.markAsTouched();
      expect(component.getFieldError('numeroCertificacion')).toContain('alfanuméricos y guiones');
    });

    it('should show error for fechaVigenciaCert when date is in the past', () => {
      const control = component.form.controls.fechaVigenciaCert;
      control.setValue('2020-01-01');
      control.markAsTouched();
      expect(component.getFieldError('fechaVigenciaCert')).toContain('presente o futura');
    });

    it('should show error for aniosExperiencia when value is negative', () => {
      const control = component.form.controls.aniosExperiencia;
      control.setValue(-1 as any);
      control.markAsTouched();
      expect(component.getFieldError('aniosExperiencia')).toContain('mínimo es 0');
    });

    it('should show error for aniosExperiencia when value exceeds 60', () => {
      const control = component.form.controls.aniosExperiencia;
      control.setValue(61 as any);
      control.markAsTouched();
      expect(component.getFieldError('aniosExperiencia')).toContain('máximo es 60');
    });

    it('should clear error when field is corrected', () => {
      const control = component.form.controls.email;
      control.setValue('invalid');
      control.markAsTouched();
      expect(component.getFieldError('email')).not.toBe('');

      control.setValue('valid@example.com');
      expect(component.getFieldError('email')).toBe('');
    });
  });

  describe('Envío exitoso', () => {
    it('should set isSubmitting to true when form is submitted', () => {
      fillAllSteps();
      component.onSubmit();
      expect(component.isSubmitting()).toBe(true);
    });

    it('should navigate to /validacion-pendiente on success', () => {
      const routerSpy = vi.spyOn((component as any).router, 'navigate');
      fillAllSteps();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro-auditor')
      );
      req.flush({ mensaje: 'Registro exitoso', email: 'juan@example.com' });

      expect(routerSpy).toHaveBeenCalledWith(['/validacion-pendiente']);
    });

    it('should reset isSubmitting after successful response', () => {
      fillAllSteps();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro-auditor')
      );
      req.flush({ mensaje: 'Registro exitoso', email: 'juan@example.com' });

      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('Envío fallido', () => {
    it('should set inline error on email when server returns 409', () => {
      fillAllSteps();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro-auditor')
      );
      req.flush(
        { error: 'CONFLICT', mensaje: 'El correo ya está registrado.' },
        { status: 409, statusText: 'Conflict' }
      );

      expect(component.form.controls.email.hasError('emailAlreadyExists')).toBe(true);
      expect(component.getFieldError('email')).toContain('ya está registrado');
      // Should navigate back to step 1 where email field is
      expect(component.currentStep()).toBe(1);
    });

    it('should show toast on server error (500)', () => {
      const toastSpy = vi.spyOn((component as any).toastService, 'show');
      fillAllSteps();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro-auditor')
      );
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(toastSpy).toHaveBeenCalledWith('Error del servidor. Intenta más tarde.', 'error');
    });

    it('should reset isSubmitting after error response', () => {
      fillAllSteps();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro-auditor')
      );
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(component.isSubmitting()).toBe(false);
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      httpTesting.expectNone((r) => r.url.includes('/auth/registro-auditor'));
      expect(component.isSubmitting()).toBe(false);
    });
  });

  // Helper functions
  function fillStep1(): void {
    const form = component.form;
    form.controls.nombre.setValue('Juan');
    form.controls.apellidos.setValue('Pérez');
    form.controls.email.setValue('juan@example.com');
    form.controls.contrasena.setValue('Password1');
    form.controls.confirmarContrasena.setValue('Password1');
    form.controls.aceptaTerminos.setValue(true);
  }

  function fillStep2(): void {
    const form = component.form;
    form.controls.numeroCertificacion.setValue('CERT-001');
    form.controls.entidadCertificadora.setValue('1');
    form.controls.fechaVigenciaCert.setValue('2030-12-31');
    form.controls.aniosExperiencia.setValue(5);
  }

  function fillStep3(): void {
    const form = component.form;
    const pdfFile = new File(['pdf'], 'cert.pdf', { type: 'application/pdf' });
    form.controls.docCertificadoPdf.setValue(pdfFile);
    form.controls.docIdentificacionPdf.setValue(pdfFile);
  }

  function fillAllSteps(): void {
    fillStep1();
    fillStep2();
    fillStep3();
  }
});
