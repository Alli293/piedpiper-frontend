import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import * as fc from 'fast-check';
import { RefinamientoChatComponent } from './refinamiento-chat.component';
import { Itinerario, ItinerarioActividad, ItinerarioDia } from '../models/itinerario.model';
import { AlternativaDTO, ComparacionResponse } from '../models/alternativas.model';

/**
 * Property 8: Failed substitution preserves original itinerary state
 * Validates: Requirements 6.4
 *
 * For any substitution that results in an error (network, 5xx, validation),
 * the itinerary displayed to the user SHALL remain identical to its state
 * before the operation was attempted.
 */
describe('Property 8: Failed substitution preserves original itinerary state', () => {
  // --- Arbitraries ---

  const actividadArb: fc.Arbitrary<ItinerarioActividad> = fc.record({
    id: fc.uuid(),
    nombre: fc
      .string({ minLength: 1, maxLength: 30 })
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
    descripcion: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 50 })),
    horario: fc.constantFrom('08:00', '10:00', '12:00', '14:00', '16:00'),
    duracionMinutos: fc.integer({ min: 30, max: 480 }),
    costoAproximado: fc.oneof(fc.constant(null), fc.integer({ min: 1000, max: 500000 })),
    moneda: fc.oneof(fc.constant(null), fc.constant('CRC'), fc.constant('USD')),
    establecimientoRecomendado: fc.oneof(
      fc.constant(null),
      fc.string({ minLength: 1, maxLength: 30 })
    ),
    provincia: fc.constantFrom(
      'San José',
      'Alajuela',
      'Cartago',
      'Heredia',
      'Guanacaste',
      'Puntarenas',
      'Limón'
    ),
    puntuacionAmbientalEstimada: fc.oneof(fc.constant(undefined), fc.integer({ min: 0, max: 100 })),
    puntuacionAmbiental: fc.constant(undefined),
    certificacionesActivas: fc.constant(undefined),
  });

  const itinerarioArb: fc.Arbitrary<Itinerario> = fc.integer({ min: 1, max: 4 }).chain((numDias) =>
    fc
      .tuple(
        fc.uuid(),
        fc.constantFrom('INDIVIDUAL', 'PAREJA', 'FAMILIAR'),
        fc.constantFrom('GENERADO', 'REFINADO'),
        fc.integer({ min: 1, max: 10 }),
        fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 100 })),
        fc.boolean(),
        fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 20 })),
        // Generate dias with unique numeroDia and 1-3 actividades each
        ...Array.from({ length: numDias }, (_, i) =>
          fc
            .array(actividadArb, { minLength: 1, maxLength: 3 })
            .map((actividades): ItinerarioDia => ({
              numeroDia: i + 1,
              fecha: `2026-09-0${i + 1}`,
              actividades,
            }))
        )
      )
      .map(
        ([
          id,
          tipoViaje,
          estado,
          version,
          puntuacion,
          generadoParcial,
          mensajeParcial,
          ...dias
        ]) => ({
          id: id as string,
          cantidadDias: numDias,
          fechaInicio: '2026-09-01',
          tipoViaje: tipoViaje as string,
          estado: estado as string,
          version: version as number,
          puntuacionAmbientalPreliminar: puntuacion as number | null,
          ecoScore: puntuacion as number | null,
          clasificacionAmbiental: null,
          ecoScoreParcial: false,
          ecoScoreCalculadoEn: null,
          favorito: false,
          fechaGeneracion: '2026-07-30T20:00:00Z',
          generadoParcial: generadoParcial as boolean,
          mensajeParcial: mensajeParcial as string | null,
          dias: dias as ItinerarioDia[],
          establecimientosEvaluados: null,
        })
      )
  );

  // Generate a valid AlternativaDTO (the one the user would try to replace with)
  const alternativaArb: fc.Arbitrary<AlternativaDTO> = fc.record({
    nombre: fc
      .string({ minLength: 1, maxLength: 30 })
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
    descripcion: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 50 })),
    ecoScore: fc.integer({ min: 0, max: 100 }),
    costoAproximado: fc.oneof(fc.constant(null), fc.integer({ min: 1000, max: 500000 })),
    moneda: fc.oneof(fc.constant(null), fc.constant('CRC'), fc.constant('USD')),
    establecimientoRecomendado: fc.oneof(
      fc.constant(null),
      fc.string({ minLength: 1, maxLength: 30 })
    ),
    diferenciaAmbiental: fc.integer({ min: -100, max: 100 }),
    mejorDesempeno: fc.boolean(),
  });

  // HTTP error status codes that represent various failure types
  const errorStatusArb = fc.constantFrom(400, 403, 500, 502, 503);

  it('el itinerario permanece idéntico tras un error en sustituirActividad', () => {
    fc.assert(
      fc.property(
        itinerarioArb,
        alternativaArb,
        errorStatusArb,
        (itinerario, alternativa, errorStatus) => {
          // Ensure there's at least one actividad with an id to select
          const actividadConId = itinerario.dias.flatMap((d) => d.actividades).find((a) => a.id);
          if (!actividadConId) return; // skip if no actividad with id

          TestBed.resetTestingModule();
          TestBed.configureTestingModule({
            imports: [RefinamientoChatComponent],
            providers: [provideHttpClient(), provideHttpClientTesting()],
          });

          const fixture = TestBed.createComponent(RefinamientoChatComponent);
          fixture.componentRef.setInput('itinerario', itinerario);
          fixture.detectChanges();

          const component = fixture.componentInstance;
          const httpMock = TestBed.inject(HttpTestingController);

          // Deep-clone the itinerario to compare after the error
          const itinerarioAntes = JSON.parse(JSON.stringify(itinerario));

          // Set up the actividadSeleccionadaId so onReemplazar works
          component['actividadSeleccionadaId'].set(actividadConId.id!);
          component['comparacionResponse'].set({
            actividadOriginalNombre: 'Test',
            ecoScoreOriginal: 50,
            categoriaTuristica: 'NATURALEZA',
            provincia: 'SAN_JOSE',
            alternativas: [alternativa],
            mensaje: null,
          });

          // Trigger the substitution attempt
          component['onReemplazar'](alternativa);

          // The service should have made a PUT request — respond with an error
          const req = httpMock.expectOne((r) => r.method === 'PUT' && r.url.includes('/sustituir'));
          req.flush({ message: 'Error' }, { status: errorStatus, statusText: 'Error' });
          fixture.detectChanges();

          // The itinerario signal should remain unchanged
          const itinerarioDespues = component.itinerario();
          expect(itinerarioDespues).toEqual(itinerarioAntes);

          // Also verify cargandoSustitucion is set back to false
          expect(component['cargandoSustitucion']()).toBe(false);

          fixture.destroy();
          httpMock.verify();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});
