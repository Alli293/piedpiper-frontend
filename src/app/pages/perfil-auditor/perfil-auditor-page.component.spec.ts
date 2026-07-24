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

  const mockAuditorId = '550e8400-e29b-41d4-a716-446655440000';
  const urlEspecialidades = `${environment.apiBaseUrl}/catalogos/especialidades`;
  const urlZonas = `${environment.apiBaseUrl}/catalogos/zonas`;
  const urlPerfil = `${environment.apiBaseUrl}/auditores/${mockAuditorId}/perfil`;

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

  const mockPerfilExistente = {
    auditorId: mockAuditorId,
    especialidades: ['HUELLA_CARBONO', 'ENERGIA_RENOVABLE'],
    zonasCobertura: ['SAN_JOSE', 'CARTAGO'],
    disponible: false,
    descripcionProfesional: 'Auditor con 5 años de experiencia',
    actualizadoEn: '2024-06-15T10:00:00Z',
  };

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

  function flushCatalogos(): void {
    httpMock.expectOne(urlEspecialidades).flush(mockEspecialidades);
    httpMock.expectOne(urlZonas).flush(mockZonas);
  }

  async function flushPerfilExistente(): Promise<void> {
    await fixture.whenStable();
    httpMock.expectOne(urlPerfil).flush(mockPerfilExistente);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function flushPerfil404(): Promise<void> {
    await fixture.whenStable();
    httpMock.expectOne(urlPerfil).flush(null, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function inicializarConPerfilExistente(): Promise<void> {
    fixture.detectChanges();
    flushCatalogos();
    await flushPerfilExistente();
  }

  async function inicializarSinPerfil(): Promise<void> {
    fixture.detectChanges();
    flushCatalogos();
    await flushPerfil404();
  }

  it('should create', async () => {
    await inicializarSinPerfil();
    expect(component).toBeTruthy();
  });

  it('solicita catálogos de especialidades y zonas al inicializar', async () => {
    fixture.detectChanges();

    const reqEsp = httpMock.expectOne(urlEspecialidades);
    const reqZonas = httpMock.expectOne(urlZonas);

    expect(reqEsp.request.method).toBe('GET');
    expect(reqZonas.request.method).toBe('GET');

    reqEsp.flush(mockEspecialidades);
    reqZonas.flush(mockZonas);
    await flushPerfil404();
  });

  it('mantiene formulario bloqueado mientras catálogos están cargando', async () => {
    // Before detectChanges, loading defaults to true
    expect(component['formularioBloqueado']()).toBe(true);

    fixture.detectChanges();
    // Requests pending - still loading
    expect(component['cargandoCatalogos']()).toBe(true);
    expect(component['formularioBloqueado']()).toBe(true);

    flushCatalogos();
    await flushPerfil404();
  });

  it('desbloquea formulario tras carga exitosa de catálogos', async () => {
    await inicializarSinPerfil();

    expect(component['cargandoCatalogos']()).toBe(false);
    expect(component['errorCatalogos']()).toBe(false);
    expect(component['formularioBloqueado']()).toBe(false);
  });

  it('almacena especialidades y zonas cargadas correctamente', async () => {
    await inicializarSinPerfil();

    expect(component['especialidades']()).toEqual(mockEspecialidades);
    expect(component['zonasCobertura']()).toEqual(mockZonas);
  });

  it('muestra toast de error y bloquea formulario si falla carga de especialidades', async () => {
    fixture.detectChanges();

    // When especialidades fails, forkJoin errors immediately
    httpMock
      .expectOne(urlEspecialidades)
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['cargandoCatalogos']()).toBe(false);
    expect(component['errorCatalogos']()).toBe(true);
    expect(component['formularioBloqueado']()).toBe(true);

    const mensajes = toastService.toasts().map((t) => t.title);
    expect(mensajes).toContain('No se pudo cargar el catálogo. Intente recargar la página.');
  });

  it('muestra toast de error y bloquea formulario si falla carga de zonas', async () => {
    fixture.detectChanges();

    httpMock.expectOne(urlEspecialidades).flush(mockEspecialidades);
    httpMock.expectOne(urlZonas).flush(null, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['cargandoCatalogos']()).toBe(false);
    expect(component['errorCatalogos']()).toBe(true);
    expect(component['formularioBloqueado']()).toBe(true);

    const mensajes = toastService.toasts().map((t) => t.title);
    expect(mensajes).toContain('No se pudo cargar el catálogo. Intente recargar la página.');
  });

  // --- Profile pre-fill tests ---

  describe('carga de perfil existente', () => {
    it('pre-llena el formulario con datos del perfil existente', async () => {
      await inicializarConPerfilExistente();

      expect(component['especialidadesSeleccionadas']()).toEqual([
        'HUELLA_CARBONO',
        'ENERGIA_RENOVABLE',
      ]);
      expect(component['zonasSeleccionadas']()).toEqual(['SAN_JOSE', 'CARTAGO']);
      expect(component['model']().descripcionProfesional).toBe('Auditor con 5 años de experiencia');
      expect(component['model']().disponible).toBe(false);
    });

    it('deja formulario vacío cuando perfil no existe (404)', async () => {
      await inicializarSinPerfil();

      expect(component['especialidadesSeleccionadas']()).toEqual([]);
      expect(component['zonasSeleccionadas']()).toEqual([]);
      expect(component['model']().descripcionProfesional).toBe('');
      expect(component['model']().disponible).toBe(true);
    });

    it('deja formulario vacío y bloquea guardado cuando obtener perfil falla con error no-404', async () => {
      fixture.detectChanges();
      flushCatalogos();
      await fixture.whenStable();
      httpMock.expectOne(urlPerfil).flush(null, { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component['especialidadesSeleccionadas']()).toEqual([]);
      expect(component['zonasSeleccionadas']()).toEqual([]);
      expect(component['model']().descripcionProfesional).toBe('');
      expect(component['errorCarga']()).toBe(true);
    });
  });

  // --- Form validation tests ---

  describe('validación de formulario', () => {
    beforeEach(async () => {
      await inicializarSinPerfil();
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
    beforeEach(async () => {
      await inicializarSinPerfil();
      // Set valid form state
      component['especialidadesSeleccionadas'].set(['HUELLA_CARBONO']);
      component['zonasSeleccionadas'].set(['SAN_JOSE']);
      component['model'].set({
        descripcionProfesional: 'Descripción válida',
        disponible: true,
      });
    });

    it('handleSubmit con formulario válido activa guardando y envía PUT', async () => {
      const event = new Event('submit');

      component['handleSubmit'](event);
      await fixture.whenStable();

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
      await fixture.whenStable();
    });

    it('en respuesta 200, guardando es false y muestra toast de éxito', async () => {
      const event = new Event('submit');
      component['handleSubmit'](event);
      await fixture.whenStable();

      const req = httpMock.expectOne(urlPerfil);
      req.flush({
        auditorId: mockAuditorId,
        especialidades: ['HUELLA_CARBONO'],
        zonasCobertura: ['SAN_JOSE'],
        disponible: true,
        descripcionProfesional: 'Descripción válida',
        actualizadoEn: '2024-01-01T00:00:00Z',
      });
      await fixture.whenStable();

      expect(component['guardando']()).toBe(false);
      const mensajes = toastService.toasts();
      expect(
        mensajes.some(
          (t) => t.title === 'Perfil actualizado correctamente.' && t.variant === 'success'
        )
      ).toBe(true);
    });

    it('en respuesta 403, guardando es false y muestra toast con mensaje del backend', async () => {
      const event = new Event('submit');
      component['handleSubmit'](event);
      await fixture.whenStable();

      const req = httpMock.expectOne(urlPerfil);
      req.flush(
        { message: 'No tiene permiso para editar este perfil.' },
        { status: 403, statusText: 'Forbidden' }
      );
      await fixture.whenStable();

      expect(component['guardando']()).toBe(false);
      const mensajes = toastService.toasts();
      expect(
        mensajes.some(
          (t) => t.title === 'No tiene permiso para editar este perfil.' && t.variant === 'error'
        )
      ).toBe(true);
    });

    it('en respuesta 500, guardando es false y muestra toast genérico de error', async () => {
      const event = new Event('submit');
      component['handleSubmit'](event);
      await fixture.whenStable();

      const req = httpMock.expectOne(urlPerfil);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
      await fixture.whenStable();

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
    beforeEach(async () => {
      await inicializarSinPerfil();
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
