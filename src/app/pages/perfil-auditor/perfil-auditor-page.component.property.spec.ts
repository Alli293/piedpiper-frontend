import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import * as fc from 'fast-check';
import { PerfilAuditorPageComponent } from './perfil-auditor-page.component';
import { environment } from '../../../environments/environment';

const catalogoEspecialidades = [
  'HUELLA_CARBONO',
  'ENERGIA_RENOVABLE',
  'GESTION_RESIDUOS',
  'EFICIENCIA_ENERGETICA',
  'BIODIVERSIDAD',
  'ECONOMIA_CIRCULAR',
  'TRANSPORTE_SOSTENIBLE',
  'AGUA_Y_SANEAMIENTO',
  'CAMBIO_CLIMATICO',
  'RESPONSABILIDAD_SOCIAL',
];
const catalogoZonas = ['SAN_JOSE', 'ALAJUELA', 'CARTAGO', 'HEREDIA', 'GUANACASTE', 'PUNTARENAS', 'LIMON'];

/**
 * Property 8: Frontend specialties cardinality blocks submission
 * Validates: Requirements 4.1, 4.2, 4.6
 *
 * For any form state where especialidades has 0 items or more than 8 items selected,
 * the form SHALL be invalid and the submit button SHALL be disabled.
 * Conversely, for 1-8 valid items with other fields valid, the form SHALL be valid.
 */
describe('Property 8: Frontend specialties cardinality blocks submission', () => {
  let fixture: ComponentFixture<PerfilAuditorPageComponent>;
  let component: PerfilAuditorPageComponent;
  let httpMock: HttpTestingController;

  const urlEspecialidades = `${environment.apiBaseUrl}/catalogos/especialidades`;
  const urlZonas = `${environment.apiBaseUrl}/catalogos/zonas-cobertura`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilAuditorPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true);
  });

  function createComponentAndFlushCatalogs(): void {
    fixture = TestBed.createComponent(PerfilAuditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne(urlEspecialidades).flush(catalogoEspecialidades);
    httpMock.expectOne(urlZonas).flush(catalogoZonas);
    fixture.detectChanges();
  }

  // Arbitrary: generate arrays with >8 items (uses catalog + synthetic extras)
  const tooManyEspecialidades = fc.integer({ min: 9, max: 15 }).chain((size) =>
    fc.shuffledSubarray(catalogoEspecialidades, {
      minLength: catalogoEspecialidades.length,
      maxLength: catalogoEspecialidades.length,
    }).map((arr) => {
      const result = [...arr];
      for (let i = arr.length; i < size; i++) {
        result.push(`EXTRA_${i}`);
      }
      return result;
    })
  );

  // Arbitrary: generate valid specialty arrays (1-8 items from catalog)
  const validEspecialidades = fc.integer({ min: 1, max: 8 }).chain((size) =>
    fc.shuffledSubarray(catalogoEspecialidades, { minLength: size, maxLength: size })
  );

  // Arbitrary: valid description (0-500 chars)
  const validDescripcion = fc.string({ minLength: 0, maxLength: 100 });

  // Arbitrary: at least one valid zona
  const validZonas = fc.integer({ min: 1, max: 7 }).chain((size) =>
    fc.shuffledSubarray(catalogoZonas, { minLength: size, maxLength: size })
  );

  it('formularioInvalido() es true cuando especialidades tiene 0 items (con otros campos válidos)', () => {
    fc.assert(
      fc.property(validZonas, validDescripcion, (zonas, descripcion) => {
        createComponentAndFlushCatalogs();

        // Set valid zonas
        component['zonasSeleccionadas'].set(zonas);
        // Set valid description
        component['model'].set({ descripcionProfesional: descripcion, disponible: true });
        // Set 0 especialidades
        component['especialidadesSeleccionadas'].set([]);

        expect(component['formularioInvalido']()).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('formularioInvalido() es true cuando especialidades tiene más de 8 items (con otros campos válidos)', () => {
    fc.assert(
      fc.property(tooManyEspecialidades, validZonas, validDescripcion, (especialidades, zonas, descripcion) => {
        createComponentAndFlushCatalogs();

        // Set valid zonas
        component['zonasSeleccionadas'].set(zonas);
        // Set valid description
        component['model'].set({ descripcionProfesional: descripcion, disponible: true });
        // Set >8 especialidades
        component['especialidadesSeleccionadas'].set(especialidades);

        expect(component['formularioInvalido']()).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('formularioInvalido() es false cuando especialidades tiene 1-8 items válidos (con otros campos válidos)', () => {
    fc.assert(
      fc.property(validEspecialidades, validZonas, validDescripcion, (especialidades, zonas, descripcion) => {
        createComponentAndFlushCatalogs();

        // Set valid zonas
        component['zonasSeleccionadas'].set(zonas);
        // Set valid description
        component['model'].set({ descripcionProfesional: descripcion, disponible: true });
        // Set valid especialidades (1-8 items)
        component['especialidadesSeleccionadas'].set(especialidades);

        expect(component['formularioInvalido']()).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 9: Frontend description length blocks submission
 * Validates: Requirements 4.4, 4.6
 *
 * For any form state where descripcionProfesional has length > 500,
 * the form SHALL be invalid and the submit button SHALL be disabled.
 */
describe('Property 9: Frontend description length blocks submission', () => {
  let fixture: ComponentFixture<PerfilAuditorPageComponent>;
  let component: PerfilAuditorPageComponent;
  let httpMock: HttpTestingController;

  const urlEspecialidades = `${environment.apiBaseUrl}/catalogos/especialidades`;
  const urlZonas = `${environment.apiBaseUrl}/catalogos/zonas-cobertura`;

  const mockEspecialidades = [
    'HUELLA_CARBONO',
    'ENERGIA_RENOVABLE',
    'GESTION_RESIDUOS',
    'EFICIENCIA_ENERGETICA',
    'BIODIVERSIDAD',
  ];
  const mockZonas = ['SAN_JOSE', 'ALAJUELA', 'CARTAGO'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilAuditorPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true);
  });

  function createComponentAndFlushCatalogs(): void {
    fixture = TestBed.createComponent(PerfilAuditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock.expectOne(urlEspecialidades).flush(mockEspecialidades);
    httpMock.expectOne(urlZonas).flush(mockZonas);
    fixture.detectChanges();
  }

  it('formularioInvalido() returns true for any description with length > 500', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 1500 }),
        (descripcionLarga) => {
          createComponentAndFlushCatalogs();

          // Set valid especialidades (1-8 items)
          component['especialidadesSeleccionadas'].set(['HUELLA_CARBONO', 'ENERGIA_RENOVABLE']);
          // Set valid zonas (1+ items)
          component['zonasSeleccionadas'].set(['SAN_JOSE']);
          // Set description > 500 chars
          component['model'].set({
            descripcionProfesional: descripcionLarga,
            disponible: true,
          });

          expect(component['formularioInvalido']()).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formularioInvalido() returns false for any description with length <= 500 (with other fields valid)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (descripcionValida) => {
          createComponentAndFlushCatalogs();

          // Set valid especialidades (1-8 items)
          component['especialidadesSeleccionadas'].set(['HUELLA_CARBONO', 'ENERGIA_RENOVABLE']);
          // Set valid zonas (1+ items)
          component['zonasSeleccionadas'].set(['SAN_JOSE']);
          // Set description <= 500 chars
          component['model'].set({
            descripcionProfesional: descripcionValida,
            disponible: true,
          });

          expect(component['formularioInvalido']()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
