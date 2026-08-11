import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import * as fc from 'fast-check';
import { CalificacionFormComponent } from './calificacion-form.component';
import { environment } from '../../../../../environments/environment';

/**
 * Property 5: Formulario deshabilitado en estado inválido
 * Validates: Requirements 4.1, 4.2
 *
 * For any estado del formulario en el que la calificación no tenga un valor seleccionado (null)
 * o el comentario supere los 500 caracteres, el botón «Guardar» SHALL permanecer deshabilitado.
 *
 * Tag: Feature: PP-56-calificacion-verificada-auditores, Property 5: Formulario deshabilitado en estado inválido
 */
describe('Feature: PP-56-calificacion-verificada-auditores, Property 5: Formulario deshabilitado en estado inválido', () => {
  let fixture: ComponentFixture<CalificacionFormComponent>;
  let component: CalificacionFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalificacionFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CalificacionFormComponent);
    fixture.componentRef.setInput('auditoriaId', 'test-auditoria-id');
    fixture.componentRef.setInput('auditorId', 'test-auditor-id');
    fixture.componentRef.setInput('estadoAuditoria', 'CERTIFICACION_EMITIDA');
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  /**
   * **Validates: Requirements 4.1**
   *
   * When calificacion is null (no value selected), puedeGuardar SHALL be false
   * regardless of the comentario content.
   */
  it('puedeGuardar() es false cuando calificacion es null (sin valor seleccionado)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (comentario) => {
          createComponent();

          // Set calificacion to null (not selected) with any valid comentario
          component['model'].set({ calificacion: null, comentario });

          fixture.detectChanges();

          expect(component['puedeGuardar']()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  /**
   * **Validates: Requirements 4.2**
   *
   * When comentario exceeds 500 characters, puedeGuardar SHALL be false
   * regardless of the calificacion value.
   */
  it('puedeGuardar() es false cuando comentario supera 500 caracteres', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 501, maxLength: 1000 }),
        (calificacion, comentarioLargo) => {
          createComponent();

          // Set valid calificacion but comentario > 500 chars
          component['model'].set({ calificacion, comentario: comentarioLargo });

          fixture.detectChanges();

          expect(component['puedeGuardar']()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  /**
   * **Validates: Requirements 4.1, 4.2**
   *
   * When both calificacion is null AND comentario exceeds 500 characters,
   * puedeGuardar SHALL also be false (both invalid conditions simultaneously).
   */
  it('puedeGuardar() es false cuando calificacion es null Y comentario supera 500 caracteres', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 1000 }),
        (comentarioLargo) => {
          createComponent();

          // Both conditions invalid: calificacion null + comentario > 500
          component['model'].set({ calificacion: null, comentario: comentarioLargo });

          fixture.detectChanges();

          expect(component['puedeGuardar']()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  /**
   * **Validates: Requirements 4.1, 4.2 (inverse)**
   *
   * When calificacion has a valid value (1-5) AND comentario is within 500 characters,
   * puedeGuardar SHALL be true (form is valid).
   */
  it('puedeGuardar() es true cuando calificacion es válida (1-5) y comentario <= 500 caracteres', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 0, maxLength: 500 }),
        (calificacion, comentario) => {
          createComponent();

          // Valid form state: calificacion in [1,5] and comentario <= 500 chars
          component['model'].set({ calificacion, comentario });

          fixture.detectChanges();

          expect(component['puedeGuardar']()).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});


/**
 * Property 6: Recuperación del formulario tras error
 * Validates: Requirements 6.6
 *
 * For any HTTP error response (4xx, 5xx, or network error) received during
 * save or update, the component SHALL re-enable the "Guardar" button and hide
 * the spinner, leaving the form ready for a new attempt.
 *
 * Tag: Feature: PP-56-calificacion-verificada-auditores, Property 6: Recuperación del formulario tras error
 */
describe('Feature: PP-56-calificacion-verificada-auditores, Property 6: Recuperación del formulario tras error', () => {
  const baseUrl = `${environment.apiBaseUrl}/calificaciones`;

  // Arbitrary: HTTP error status codes (4xx: 400-499, 5xx: 500-599, 0 for network error)
  const anyErrorStatusArb = fc.oneof(
    fc.integer({ min: 400, max: 499 }),
    fc.integer({ min: 500, max: 599 }),
    fc.constant(0)
  );

  function setupComponent(): {
    fixture: ComponentFixture<CalificacionFormComponent>;
    component: CalificacionFormComponent;
    httpMock: HttpTestingController;
  } {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CalificacionFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    const fixture = TestBed.createComponent(CalificacionFormComponent);
    fixture.componentRef.setInput('auditoriaId', 'test-auditoria-id');
    fixture.componentRef.setInput('auditorId', 'test-auditor-id');
    fixture.componentRef.setInput('estadoAuditoria', 'CERTIFICACION_EMITIDA');
    fixture.componentRef.setInput('empresaIdUsuario', 'test-empresa-id');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    return { fixture, component, httpMock };
  }

  /**
   * **Validates: Requirements 6.6**
   *
   * For any error status code (4xx, 5xx, or network error=0), after a failed
   * creation attempt, guardando SHALL be false (button re-enabled, spinner hidden).
   */
  it('guardando vuelve a false tras cualquier error HTTP en modo creación', async () => {
    await fc.assert(
      fc.asyncProperty(anyErrorStatusArb, async (errorStatus) => {
        const { fixture, component, httpMock } = setupComponent();

        // Set a valid calificacion so the form can be submitted
        component['model'].set({ calificacion: 3, comentario: '' });
        fixture.detectChanges();

        // Call guardar() directly — it returns a Promise we can await
        const guardarPromise = (component as any)['guardar']() as Promise<void>;

        // After starting guardar, flush the HTTP request
        await fixture.whenStable();
        fixture.detectChanges();

        const req = httpMock.expectOne((r) => r.method === 'POST' && r.url === baseUrl);

        if (errorStatus === 0) {
          req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
        } else {
          req.flush({ message: 'Error' }, { status: errorStatus, statusText: 'Error' });
        }

        // Wait for the full promise chain to resolve
        await guardarPromise;
        fixture.detectChanges();

        // After error, guardando must be false (button re-enabled, spinner hidden)
        expect(component['guardando']()).toBe(false);

        fixture.destroy();
        httpMock.verify();
      }),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * **Validates: Requirements 6.6**
   *
   * For any error status code (4xx, 5xx, or network error=0), after a failed
   * edit attempt, guardando SHALL be false (button re-enabled, spinner hidden).
   */
  it('guardando vuelve a false tras cualquier error HTTP en modo edición', async () => {
    await fc.assert(
      fc.asyncProperty(anyErrorStatusArb, async (errorStatus) => {
        const { fixture, component, httpMock } = setupComponent();

        // Set up the component in edit mode by setting calificacionId
        (component as any)['calificacionId'].set('existing-calificacion-id');
        component['model'].set({ calificacion: 4, comentario: 'Buen trabajo' });
        fixture.detectChanges();

        // Call guardar() directly — it returns a Promise we can await
        const guardarPromise = (component as any)['guardar']() as Promise<void>;

        // After starting guardar, flush the HTTP request
        await fixture.whenStable();
        fixture.detectChanges();

        const req = httpMock.expectOne(
          (r) => r.method === 'PUT' && r.url === `${baseUrl}/existing-calificacion-id`
        );

        if (errorStatus === 0) {
          req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
        } else {
          req.flush({ message: 'Error' }, { status: errorStatus, statusText: 'Error' });
        }

        // Wait for the full promise chain to resolve
        await guardarPromise;
        fixture.detectChanges();

        // After error, guardando must be false (button re-enabled, spinner hidden)
        expect(component['guardando']()).toBe(false);

        fixture.destroy();
        httpMock.verify();
      }),
      { numRuns: 100 }
    );
  }, 60000);
});
