import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import * as fc from 'fast-check';
import { PerfilAuditorPageComponent } from './perfil-auditor-page.component';
import { environment } from '../../../environments/environment';

const catalogoEspecialidades = [
  { valor: 'HUELLA_CARBONO', etiqueta: 'Huella carbono' },
  { valor: 'ENERGIA_RENOVABLE', etiqueta: 'Energia renovable' },
  { valor: 'GESTION_RESIDUOS', etiqueta: 'Gestion residuos' },
  { valor: 'EFICIENCIA_ENERGETICA', etiqueta: 'Eficiencia energetica' },
  { valor: 'BIODIVERSIDAD', etiqueta: 'Biodiversidad' },
  { valor: 'ECONOMIA_CIRCULAR', etiqueta: 'Economia circular' },
  { valor: 'TRANSPORTE_SOSTENIBLE', etiqueta: 'Transporte sostenible' },
  { valor: 'AGUA_Y_SANEAMIENTO', etiqueta: 'Agua y saneamiento' },
  { valor: 'CAMBIO_CLIMATICO', etiqueta: 'Cambio climatico' },
  { valor: 'RESPONSABILIDAD_SOCIAL', etiqueta: 'Responsabilidad social' },
];
const catalogoEspecialidadesValores = catalogoEspecialidades.map((e) => e.valor);
const catalogoZonas = [
  { valor: 'SAN_JOSE', etiqueta: 'San jose' },
  { valor: 'ALAJUELA', etiqueta: 'Alajuela' },
  { valor: 'CARTAGO', etiqueta: 'Cartago' },
  { valor: 'HEREDIA', etiqueta: 'Heredia' },
  { valor: 'GUANACASTE', etiqueta: 'Guanacaste' },
  { valor: 'PUNTARENAS', etiqueta: 'Puntarenas' },
  { valor: 'LIMON', etiqueta: 'Limon' },
];
const catalogoZonasValores = catalogoZonas.map((z) => z.valor);

/**
 * Propiedad 8: La cardinalidad de especialidades bloquea el envío del formulario
 * Valida: Requisitos 4.1, 4.2, 4.6
 *
 * Para cualquier estado del formulario donde especialidades tiene 0 o más de 8 items seleccionados,
 * el formulario DEBE ser inválido y el botón de envío DEBE estar deshabilitado.
 * Inversamente, para 1-8 items válidos con los demás campos válidos, el formulario DEBE ser válido.
 */
describe('Propiedad 8: cardinalidad de especialidades bloquea el envío', () => {
  let fixture: ComponentFixture<PerfilAuditorPageComponent>;
  let component: PerfilAuditorPageComponent;
  let httpMock: HttpTestingController;

  const urlEspecialidades = `${environment.apiBaseUrl}/catalogos/especialidades`;
  const urlZonas = `${environment.apiBaseUrl}/catalogos/zonas`;

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

  // Arbitrary: generate arrays with >8 items (uses catalog valores + synthetic extras)
  const tooManyEspecialidades = fc.integer({ min: 9, max: 15 }).chain((size) =>
    fc
      .shuffledSubarray(catalogoEspecialidadesValores, {
        minLength: catalogoEspecialidadesValores.length,
        maxLength: catalogoEspecialidadesValores.length,
      })
      .map((arr) => {
        const result = [...arr];
        for (let i = arr.length; i < size; i++) {
          result.push(`EXTRA_${i}`);
        }
        return result;
      })
  );

  // Arbitrary: generate valid specialty arrays (1-8 items from catalog valores)
  const validEspecialidades = fc
    .integer({ min: 1, max: 8 })
    .chain((size) =>
      fc.shuffledSubarray(catalogoEspecialidadesValores, { minLength: size, maxLength: size })
    );

  // Arbitrary: valid description (0-500 chars)
  const validDescripcion = fc.string({ minLength: 0, maxLength: 100 });

  // Arbitrary: at least one valid zona
  const validZonas = fc
    .integer({ min: 1, max: 7 })
    .chain((size) =>
      fc.shuffledSubarray(catalogoZonasValores, { minLength: size, maxLength: size })
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
      fc.property(
        tooManyEspecialidades,
        validZonas,
        validDescripcion,
        (especialidades, zonas, descripcion) => {
          createComponentAndFlushCatalogs();

          // Set valid zonas
          component['zonasSeleccionadas'].set(zonas);
          // Set valid description
          component['model'].set({ descripcionProfesional: descripcion, disponible: true });
          // Set >8 especialidades
          component['especialidadesSeleccionadas'].set(especialidades);

          expect(component['formularioInvalido']()).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formularioInvalido() es false cuando especialidades tiene 1-8 items válidos (con otros campos válidos)', () => {
    fc.assert(
      fc.property(
        validEspecialidades,
        validZonas,
        validDescripcion,
        (especialidades, zonas, descripcion) => {
          createComponentAndFlushCatalogs();

          // Set valid zonas
          component['zonasSeleccionadas'].set(zonas);
          // Set valid description
          component['model'].set({ descripcionProfesional: descripcion, disponible: true });
          // Set valid especialidades (1-8 items)
          component['especialidadesSeleccionadas'].set(especialidades);

          expect(component['formularioInvalido']()).toBe(false);
        }
      ),
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
  const urlZonas = `${environment.apiBaseUrl}/catalogos/zonas`;

  const mockEspecialidades = [
    { valor: 'HUELLA_CARBONO', etiqueta: 'Huella carbono' },
    { valor: 'ENERGIA_RENOVABLE', etiqueta: 'Energia renovable' },
    { valor: 'GESTION_RESIDUOS', etiqueta: 'Gestion residuos' },
    { valor: 'EFICIENCIA_ENERGETICA', etiqueta: 'Eficiencia energetica' },
    { valor: 'BIODIVERSIDAD', etiqueta: 'Biodiversidad' },
  ];
  const mockZonas = [
    { valor: 'SAN_JOSE', etiqueta: 'San jose' },
    { valor: 'ALAJUELA', etiqueta: 'Alajuela' },
    { valor: 'CARTAGO', etiqueta: 'Cartago' },
  ];

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
      fc.property(fc.string({ minLength: 501, maxLength: 1500 }), (descripcionLarga) => {
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
      }),
      { numRuns: 100 }
    );
  });

  it('formularioInvalido() returns false for any description with length <= 500 (with other fields valid)', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 500 }), (descripcionValida) => {
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
      }),
      { numRuns: 100 }
    );
  });
});
