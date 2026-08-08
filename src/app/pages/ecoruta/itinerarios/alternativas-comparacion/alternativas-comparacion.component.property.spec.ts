import { TestBed, ComponentFixture } from '@angular/core/testing';
import * as fc from 'fast-check';
import { AlternativasComparacionComponent } from './alternativas-comparacion.component';
import { AlternativaDTO } from '../models/alternativas.model';

/**
 * Property 7: Card rendering includes all required fields with correct indicators
 * Validates: Requirements 5.1, 5.3
 *
 * For any AlternativaDTO, the rendered card SHALL display the nombre, ecoScore,
 * costoAproximado, and diferenciaAmbiental. If diferenciaAmbiental > 0, the indicator
 * SHALL be positive; if diferenciaAmbiental < 0, the indicator SHALL be negative.
 */
describe('Property 7: Card rendering includes all required fields with correct indicators', () => {
  // Arbitrary: generate a valid AlternativaDTO with non-zero diferenciaAmbiental
  // nombre avoids leading/trailing whitespace since browsers collapse whitespace in text nodes
  const nombreArb = fc
    .string({ minLength: 1, maxLength: 50 })
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const alternativaDTOArb: fc.Arbitrary<AlternativaDTO> = fc.record({
    nombre: nombreArb,
    descripcion: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 100 })),
    ecoScore: fc.integer({ min: 0, max: 100 }),
    costoAproximado: fc.oneof(fc.constant(null), fc.integer({ min: 100, max: 999999 })),
    moneda: fc.oneof(fc.constant(null), fc.constant('CRC'), fc.constant('USD')),
    establecimientoRecomendado: fc.oneof(
      fc.constant(null),
      fc.string({ minLength: 1, maxLength: 50 })
    ),
    diferenciaAmbiental: fc.integer({ min: -100, max: 100 }).filter((d) => d !== 0),
    mejorDesempeno: fc.boolean(),
  });

  function createComponent(
    alternativas: AlternativaDTO[]
  ): ComponentFixture<AlternativasComparacionComponent> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AlternativasComparacionComponent],
    });

    const fixture = TestBed.createComponent(AlternativasComparacionComponent);
    fixture.componentRef.setInput('alternativas', alternativas);
    fixture.componentRef.setInput('actividadOriginal', {
      nombre: 'Actividad Original',
      ecoScore: 50,
    });
    fixture.componentRef.setInput('cargando', false);
    fixture.detectChanges();
    return fixture;
  }

  it('cada tarjeta renderizada muestra nombre, ecoScore, costoAproximado y diferenciaAmbiental', () => {
    fc.assert(
      fc.property(alternativaDTOArb, (alt) => {
        const fixture = createComponent([alt]);
        const nativeEl: HTMLElement = fixture.nativeElement;

        // Verify nombre is rendered inside a <strong> tag
        const strongEl = nativeEl.querySelector('.ch-alternativas__tarjeta-nombre strong');
        expect(strongEl).not.toBeNull();
        expect(strongEl!.textContent!.trim()).toBe(alt.nombre);

        // Verify ecoScore is rendered
        const scoreEl = nativeEl.querySelector('.ch-alternativas__score-valor');
        expect(scoreEl).not.toBeNull();
        expect(scoreEl!.textContent!.trim()).toBe(String(alt.ecoScore));

        // Verify costoAproximado is rendered (if not null)
        if (alt.costoAproximado !== null) {
          const detailEl = nativeEl.querySelector('.ch-alternativas__tarjeta-detalle');
          expect(detailEl).not.toBeNull();
          // DecimalPipe formats with commas (e.g. 1,000)
          const formatted = alt.costoAproximado.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });
          expect(detailEl!.textContent).toContain(formatted);
        }

        // Verify diferenciaAmbiental is rendered
        const difEl = nativeEl.querySelector('.ch-alternativas__diferencia');
        expect(difEl).not.toBeNull();
        expect(difEl!.textContent).toContain(String(Math.abs(alt.diferenciaAmbiental)));

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  }, 30000);

  it('diferenciaAmbiental > 0 muestra indicador positivo (clase --positiva)', () => {
    const positiveAltArb = alternativaDTOArb.filter((a) => a.diferenciaAmbiental > 0);

    fc.assert(
      fc.property(positiveAltArb, (alt) => {
        const fixture = createComponent([alt]);
        const nativeEl: HTMLElement = fixture.nativeElement;

        const difEl = nativeEl.querySelector('.ch-alternativas__diferencia');
        expect(difEl).not.toBeNull();
        expect(difEl!.classList.contains('ch-alternativas__diferencia--positiva')).toBe(true);
        expect(difEl!.classList.contains('ch-alternativas__diferencia--negativa')).toBe(false);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  }, 30000);

  it('diferenciaAmbiental < 0 muestra indicador negativo (clase --negativa)', () => {
    const negativeAltArb = alternativaDTOArb.filter((a) => a.diferenciaAmbiental < 0);

    fc.assert(
      fc.property(negativeAltArb, (alt) => {
        const fixture = createComponent([alt]);
        const nativeEl: HTMLElement = fixture.nativeElement;

        const difEl = nativeEl.querySelector('.ch-alternativas__diferencia');
        expect(difEl).not.toBeNull();
        expect(difEl!.classList.contains('ch-alternativas__diferencia--negativa')).toBe(true);
        expect(difEl!.classList.contains('ch-alternativas__diferencia--positiva')).toBe(false);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  }, 30000);
});
