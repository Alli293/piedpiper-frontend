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
          { path: 'registro', component: DummyComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegistroAuditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Renderizado inicial', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have all form controls initialized as empty', () => {
      const form = component.form;
      expect(form.controls.nombre.value).toBe('');
      expect(form.controls.apellidos.value).toBe('');
      expect(form.controls.email.value).toBe('');
      expect(form.controls.contrasena.value).toBe('');
      expect(form.controls.confirmarContrasena.value).toBe('');
      expect(form.controls.aceptaTerminos.value).toBe(false);
    });

    it('should not display any error messages initially', () => {
      expect(component.getFieldError('nombre')).toBe('');
      expect(component.getFieldError('apellidos')).toBe('');
      expect(component.getFieldError('email')).toBe('');
      expect(component.getFieldError('contrasena')).toBe('');
      expect(component.getFieldError('confirmarContrasena')).toBe('');
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
      fillForm();
      component.onSubmit();
      expect(component.isSubmitting()).toBe(true);
    });

    it('should send JSON body (not FormData) to the correct endpoint', () => {
      fillForm();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro/auditor/correo')
      );

      expect(req.request.body).toEqual({
        nombre: 'Juan',
        apellidos: 'Pérez',
        email: 'juan@example.com',
        contrasena: 'Password1',
        aceptaTerminos: true,
      });

      req.flush({ mensaje: 'Registro exitoso', email: 'juan@example.com' });
    });

    it('should navigate to /validacion-pendiente on success', () => {
      const routerSpy = vi.spyOn((component as any).router, 'navigate');
      fillForm();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro/auditor/correo')
      );
      req.flush({ mensaje: 'Registro exitoso', email: 'juan@example.com' });

      expect(routerSpy).toHaveBeenCalledWith(['/validacion-pendiente']);
    });

    it('should reset isSubmitting after successful response', () => {
      fillForm();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro/auditor/correo')
      );
      req.flush({ mensaje: 'Registro exitoso', email: 'juan@example.com' });

      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('Envío fallido', () => {
    it('should set inline error on email when server returns 409', () => {
      fillForm();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro/auditor/correo')
      );
      req.flush(
        { error: 'CONFLICT', mensaje: 'El correo ya está registrado.' },
        { status: 409, statusText: 'Conflict' }
      );

      expect(component.form.controls.email.hasError('emailAlreadyExists')).toBe(true);
      expect(component.getFieldError('email')).toContain('ya está registrado');
    });

    it('should show toast on server error (500)', () => {
      const toastSpy = vi.spyOn((component as any).toastService, 'show');
      fillForm();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro/auditor/correo')
      );
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(toastSpy).toHaveBeenCalledWith('Error del servidor. Intenta más tarde.', 'error');
    });

    it('should reset isSubmitting after error response', () => {
      fillForm();
      component.onSubmit();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/registro/auditor/correo')
      );
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(component.isSubmitting()).toBe(false);
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      httpTesting.expectNone((r) => r.url.includes('/auth/registro/auditor/correo'));
      expect(component.isSubmitting()).toBe(false);
    });
  });

  function fillForm(): void {
    const form = component.form;
    form.controls.nombre.setValue('Juan');
    form.controls.apellidos.setValue('Pérez');
    form.controls.email.setValue('juan@example.com');
    form.controls.contrasena.setValue('Password1');
    form.controls.confirmarContrasena.setValue('Password1');
    form.controls.aceptaTerminos.setValue(true);
  }
});
