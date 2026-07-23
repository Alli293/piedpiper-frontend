import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { PerfilAuditorPageComponent } from './perfil-auditor-page.component';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

describe('PerfilAuditorPageComponent', () => {
  let fixture: ComponentFixture<PerfilAuditorPageComponent>;
  let component: PerfilAuditorPageComponent;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  const urlEspecialidades = `${environment.apiBaseUrl}/catalogos/especialidades`;
  const urlZonas = `${environment.apiBaseUrl}/catalogos/zonas-cobertura`;

  const mockEspecialidades = [
    'HUELLA_CARBONO',
    'ENERGIA_RENOVABLE',
    'GESTION_RESIDUOS',
  ];
  const mockZonas = ['SAN_JOSE', 'ALAJUELA', 'CARTAGO'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilAuditorPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
    expect(mensajes).toContain(
      'No se pudo cargar el catálogo. Intente recargar la página.'
    );
  });

  it('muestra toast de error y bloquea formulario si falla carga de zonas', () => {
    fixture.detectChanges();

    httpMock.expectOne(urlEspecialidades).flush(mockEspecialidades);
    httpMock
      .expectOne(urlZonas)
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(component['cargandoCatalogos']()).toBe(false);
    expect(component['errorCatalogos']()).toBe(true);
    expect(component['formularioBloqueado']()).toBe(true);

    const mensajes = toastService.toasts().map((t) => t.title);
    expect(mensajes).toContain(
      'No se pudo cargar el catálogo. Intente recargar la página.'
    );
  });
});
