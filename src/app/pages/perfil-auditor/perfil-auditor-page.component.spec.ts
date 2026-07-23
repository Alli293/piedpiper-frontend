import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PerfilAuditorPageComponent } from './perfil-auditor-page.component';
import { ToastService } from '../../shared/services/toast.service';
import { AuthSessionService } from '../../core/auth-session.service';
import { environment } from '../../../environments/environment';

/**
 * NOTE: Bracket notation (component['signalName']()) is used intentionally throughout
 * these tests. This is a common Angular testing pattern for signal-based components
 * that allows unit testing internal state without requiring DOM interaction or
 * template rendering for every assertion.
 */
describe('PerfilAuditorPageComponent', () => {
  let fixture: ComponentFixture<PerfilAuditorPageComponent>;
  let component: PerfilAuditorPageComponent;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  const urlEspecialidades = `${environment.apiBaseUrl}/catalogos/especialidades`;
  const urlZonas = `${environment.apiBaseUrl}/catalogos/zonas`;

  const mockAuditorId = '550e8400-e29b-41d4-a716-446655440000';

  const mockEspecialidades = [
    { valor: 'HUELLA_CARBONO', etiqueta: 'Huella carbono' },
    { valor: 'ENERGIA_RENOVABLE', etiqueta: 'Energia renovable' },
    { valor: 'GESTION_RESIDUOS', etiqueta: 'Gestion residuos' },
  ];
  const mockZonas = [
    { valor: 'SAN_JOSE', etiqueta: 'San jose' },
    { valor: 'ALAJUELA', etiqueta: 'Alajuela' },
    { valor: 'CARTAGO', etiqueta: 'Cartago' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilAuditorPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthSessionService,
          useValue: {
            getUserId: () => mockAuditorId,
            getUserInitials: () => 'AU',
            getUserName: () => 'Auditor Test',
            getUserEmail: () => 'auditor@test.com',
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);

    fixture = TestBed.createComponent(PerfilAuditorPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Discard any pending requests that were cancelled by forkJoin unsubscription
    httpMock.match(() => true);
  });

  function flushCatalogosExitosamente(): void {
    httpMock.expectOne(urlEspecialidades).flush(mockEspecialidades);
    httpMock.expectOne(urlZonas).flush(mockZonas);
    fixture.detectChanges();
  }

  it('should create', () => {
    fixture.detectChanges();
    flushCatalogosExitosamente();
    expect(component).toBeTruthy();
  });

  it('solicita catálogos de especialidades y zonas al inicializar', () => {
    fixture.detectChanges();

    const reqEsp = httpMock.expectOne(urlEspecialidades);
    const reqZonas = httpMock.expectOne(urlZonas);

    expect(reqEsp.request.method).toBe('GET');
    expect(reqZonas.request.method).toBe('GET');

    reqEsp.flush(mockEspecialidades);
    reqZonas.flush(mockZonas);
    fixture.detectChanges();
  });

  it('mantiene formulario bloqueado mientras catálogos están cargando', () => {
    // Before detectChanges, loading defaults to true
    expect(component['formularioBloqueado']()).toBe(true);

    fixture.detectChanges();
    // Requests pending - still loading
    expect(component['cargandoCatalogos']()).toBe(true);
    expect(component['formularioBloqueado']()).toBe(true);

    flushCatalogosExitosamente();
  });

  it('desbloquea formulario tras carga exitosa de catálogos', () => {
    fixture.detectChanges();
    flushCatalogosExitosamente();

    expect(component['cargandoCatalogos']()).toBe(false);
    expect(component['errorCatalogos']()).toBe(false);
    expect(component['formularioBloqueado']()).toBe(false);
  });

  it('almacena especialidades y zonas cargadas correctamente', () => {
    fixture.detectChanges();
    flushCatalogosExitosamente();

    expect(component['especialidades']()).toEqual(mockEspecialidades);
    expect(component['zonasCobertura']()).toEqual(mockZonas);
  });

  it('muestra toast de error y bloquea formulario si falla carga de especialidades', () => {
    fixture.detectChanges();

    // When especialidades fails, forkJoin errors immediately
    httpMock
      .expectOne(urlEspecialidades)
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(component['cargandoCatalogos']()).toBe(false);
    expect(component['errorCatalogos']()).toBe(true);
    expect(component['formularioBloqueado']()).toBe(true);

    const mensajes = toastService.toasts().map((t) => t.title);
    expect(mensajes).toContain('No se pudo cargar el catálogo. Intente recargar la página.');
  });

  it('muestra toast de error y bloquea formulario si falla carga de zonas', () => {
    fixture.detectChanges();

    httpMock.expectOne(urlEspecialidades).flush(mockEspecialidades);
    httpMock.expectOne(urlZonas).flush(null, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(component['cargandoCatalogos']()).toBe(false);
    expect(component['errorCatalogos']()).toBe(true);
    expect(component['formularioBloqueado']()).toBe(true);

    const mensajes = toastService.toasts().map((t) => t.title);
    expect(mensajes).toContain('No se pudo cargar el catálogo. Intente recargar la página.');
  });

  // --- Form validation tests ---

  describe('validación de formulario', () => {
    beforeEach(() => {
      fixture.detectChanges();
      flushCatalogosExitosamente();
    });

    it('formularioInvalido() es true cuando especialidades está vacío', () => {
      component['especialidadesSeleccionadas'].set([]);
      component['zonasSeleccionadas'].set(['SAN_JOSE']);

      expect(component['formularioInvalido']()).toBe(true);
    });

    it('formularioInvalido() es true cuando especialidades tiene más de 8 valores', () => {
      component['especialidadesSeleccionadas'].set([
        'HUELLA_CARBONO',
        'ENERGIA_RENOVABLE',
        'GESTION_RESIDUOS',
        'EFICIENCIA_ENERGETICA',
        'BIODIVERSIDAD',
        'ECONOMIA_CIRCULAR',
        'TRANSPORTE_SOSTENIBLE',
        'AGUA_Y_SANEAMIENTO',
        'CAMBIO_CLIMATICO',
      ]);
      component['zonasSeleccionadas'].set(['SAN_JOSE']);

      expect(component['formularioInvalido']()).toBe(true);
    });

    it('formularioInvalido() es false con especialidades 1-8, zonas válidas y descripción corta', () => {
      component['especialidadesSeleccionadas'].set(['HUELLA_CARBONO', 'ENERGIA_RENOVABLE']);
      component['zonasSeleccionadas'].set(['SAN_JOSE', 'CARTAGO']);
      component['model'].set({
        descripcionProfesional: 'Mi descripción profesional',
        disponible: true,
      });

      expect(component['formularioInvalido']()).toBe(false);
    });

    it('formularioInvalido() es true cuando zonasCobertura está vacío', () => {
      component['especialidadesSeleccionadas'].set(['HUELLA_CARBONO']);
      component['zonasSeleccionadas'].set([]);

      expect(component['formularioInvalido']()).toBe(true);
    });

    it('formularioInvalido() es true cuando descripcionProfesional supera 500 caracteres', () => {
      component['especialidadesSeleccionadas'].set(['HUELLA_CARBONO']);
      component['zonasSeleccionadas'].set(['SAN_JOSE']);
      component['model'].set({
        descripcionProfesional: 'x'.repeat(501),
        disponible: true,
      });

      expect(component['formularioInvalido']()).toBe(true);
    });
  });

  // --- Save/spinner tests ---

  describe('guardado y spinner', () => {
    const urlPerfil = `${environment.apiBaseUrl}/auditores/${mockAuditorId}/perfil`;

    beforeEach(() => {
      fixture.detectChanges();
      flushCatalogosExitosamente();
      // Set valid form state
      component['especialidadesSeleccionadas'].set(['HUELLA_CARBONO']);
      component['zonasSeleccionadas'].set(['SAN_JOSE']);
      component['model'].set({
        descripcionProfesional: 'Descripción válida',
        disponible: true,
      });
    });

    it('handleSubmit con formulario válido activa guardando y envía PUT', () => {
      const event = new Event('submit');

      component['handleSubmit'](event);

      expect(component['guardando']()).toBe(true);

      const req = httpMock.expectOne(urlPerfil);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        especialidades: ['HUELLA_CARBONO'],
        zonasCobertura: ['SAN_JOSE'],
        disponible: true,
        descripcionProfesional: 'Descripción válida',
      });

      req.flush({
        auditorId: mockAuditorId,
        especialidades: ['HUELLA_CARBONO'],
        zonasCobertura: ['SAN_JOSE'],
        disponible: true,
        descripcionProfesional: 'Descripción válida',
        actualizadoEn: '2024-01-01T00:00:00Z',
      });
    });

    it('en respuesta 200, guardando es false y muestra toast de éxito', () => {
      const event = new Event('submit');
      component['handleSubmit'](event);

      const req = httpMock.expectOne(urlPerfil);
      req.flush({
        auditorId: mockAuditorId,
        especialidades: ['HUELLA_CARBONO'],
        zonasCobertura: ['SAN_JOSE'],
        disponible: true,
        descripcionProfesional: 'Descripción válida',
        actualizadoEn: '2024-01-01T00:00:00Z',
      });

      expect(component['guardando']()).toBe(false);
      const mensajes = toastService.toasts();
      expect(
        mensajes.some(
          (t) => t.title === 'Perfil actualizado correctamente.' && t.variant === 'success'
        )
      ).toBe(true);
    });

    it('en respuesta 403, guardando es false y muestra toast con mensaje del backend', () => {
      const event = new Event('submit');
      component['handleSubmit'](event);

      const req = httpMock.expectOne(urlPerfil);
      req.flush(
        { message: 'No tiene permiso para editar este perfil.' },
        { status: 403, statusText: 'Forbidden' }
      );

      expect(component['guardando']()).toBe(false);
      const mensajes = toastService.toasts();
      expect(
        mensajes.some(
          (t) => t.title === 'No tiene permiso para editar este perfil.' && t.variant === 'error'
        )
      ).toBe(true);
    });

    it('en respuesta 500, guardando es false y muestra toast genérico de error', () => {
      const event = new Event('submit');
      component['handleSubmit'](event);

      const req = httpMock.expectOne(urlPerfil);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(component['guardando']()).toBe(false);
      const mensajes = toastService.toasts();
      expect(
        mensajes.some(
          (t) =>
            t.title === 'No se pudo guardar el perfil. Intente nuevamente.' && t.variant === 'error'
        )
      ).toBe(true);
    });
  });

  // --- Error messages display tests ---

  describe('mensajes de error inline', () => {
    beforeEach(() => {
      fixture.detectChanges();
      flushCatalogosExitosamente();
    });

    it('errorEspecialidades() muestra mensaje cuando se deselecciona hasta vacío', () => {
      component['especialidadesSeleccionadas'].set(['HUELLA_CARBONO']);
      component['toggleEspecialidad']('HUELLA_CARBONO');

      expect(component['especialidadesSeleccionadas']()).toEqual([]);
      expect(component['errorEspecialidades']()).toBe('Seleccione al menos una especialidad.');
    });

    it('errorZonas() muestra mensaje cuando se deselecciona hasta vacío', () => {
      component['zonasSeleccionadas'].set(['SAN_JOSE']);
      component['toggleZona']('SAN_JOSE');

      expect(component['zonasSeleccionadas']()).toEqual([]);
      expect(component['errorZonas']()).toBe('Seleccione al menos una zona de cobertura.');
    });
  });
});
