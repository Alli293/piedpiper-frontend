import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ConfiguracionInicialPerfilPageComponent } from './configuracion-inicial-perfil-page.component';
import { PerfilInicialService } from '../../core/services/perfil-inicial.service';
import { ToastService } from '../../shared/services/toast.service';
import { PerfilInicial } from '../../core/models/perfil-inicial.model';

describe('ConfiguracionInicialPerfilPageComponent', () => {
  let fixture: ComponentFixture<ConfiguracionInicialPerfilPageComponent>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  const perfilIndividual: PerfilInicial = {
    nombreVisible: 'Ana',
    preferencias: { idioma: 'ESPANOL', moneda: 'CRC', unidades: 'METRICO' },
    rol: 'USUARIO_INDIVIDUAL',
    configuracionCompleta: false,
    redirect: '/perfil/configuracion-inicial',
    empresa: null,
  };

  const empresa = {
    nombreEmpresa: 'Café del Valle S.A.',
    sectorIndustrial: 'AGROINDUSTRIA',
    pais: 'Costa Rica',
    cantidadEmpleados: 10,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionInicialPerfilPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionInicialPerfilPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  function flushCarga(perfil: PerfilInicial): void {
    fixture.detectChanges();
    httpMock.expectOne(PerfilInicialService.URL).flush(perfil);
    fixture.detectChanges();
  }

  function botonGuardar(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('[data-testid="guardar-perfil"] button');
  }

  function inputNombre(): HTMLInputElement {
    return fixture.nativeElement.querySelector('[data-testid="nombre-visible"] input');
  }

  it('muestra nombre y preferencias para el usuario individual, sin sección de empresa', () => {
    flushCarga(perfilIndividual);

    expect(inputNombre().value).toBe('Ana');
    expect(fixture.nativeElement.querySelectorAll('app-select-input').length).toBe(3);
    expect(fixture.nativeElement.querySelector('[data-testid^="sector-industrial"]')).toBeNull();
  });

  it('el administrador de plataforma renderiza como perfil básico, sin sección de empresa', () => {
    flushCarga({ ...perfilIndividual, rol: 'ADMINISTRADOR_PLATAFORMA' });

    expect(inputNombre().value).toBe('Ana');
    expect(fixture.nativeElement.querySelectorAll('app-select-input').length).toBe(3);
    expect(fixture.nativeElement.querySelector('[data-testid^="sector-industrial"]')).toBeNull();
    expect(botonGuardar()).not.toBeNull();
  });

  it('el usuario general ve los datos de empresa en solo lectura', () => {
    flushCarga({ ...perfilIndividual, rol: 'USUARIO_GENERAL', empresa });

    const nombreEmpresa: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="empresa-nombre"] input'
    );
    const pais: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="pais-lectura"] input'
    );
    expect(nombreEmpresa.value).toBe('Café del Valle S.A.');
    expect(nombreEmpresa.disabled).toBe(true);
    expect(pais.disabled).toBe(true);
  });

  it('el administrador de empresa puede editar sector, país y empleados', () => {
    flushCarga({ ...perfilIndividual, rol: 'ADMINISTRADOR_EMPRESA', empresa });

    const sector = fixture.nativeElement.querySelector(
      '[data-testid="sector-industrial-editable"] select'
    );
    const pais: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="pais-editable"] input'
    );
    expect(sector).not.toBeNull();
    expect(sector.disabled).toBe(false);
    expect(pais.disabled).toBe(false);
  });

  it('el auditor ve la nota de credenciales en validación', () => {
    flushCarga({ ...perfilIndividual, rol: 'AUDITOR_CERTIFICADO' });

    expect(fixture.nativeElement.textContent).toContain(
      'Tus credenciales profesionales están en validación'
    );
  });

  it('valida el nombre inline y no envía el PUT si es inválido', () => {
    flushCarga(perfilIndividual);

    inputNombre().value = 'A';
    inputNombre().dispatchEvent(new Event('input'));
    fixture.detectChanges();

    botonGuardar().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'El nombre debe tener al menos 2 caracteres.'
    );
    httpMock.expectNone(PerfilInicialService.URL);
  });

  it('valida el maximo de 100 caracteres del nombre y no envia el PUT', () => {
    flushCarga(perfilIndividual);

    inputNombre().value = 'A'.repeat(101);
    inputNombre().dispatchEvent(new Event('input'));
    fixture.detectChanges();

    botonGuardar().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'El nombre no puede superar los 100 caracteres.'
    );
    httpMock.expectNone(PerfilInicialService.URL);
  });

  it('guarda el perfil, muestra el spinner y redirige al panel del rol', async () => {
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    flushCarga(perfilIndividual);

    botonGuardar().click();
    fixture.detectChanges();

    expect(botonGuardar().disabled).toBe(true);

    const req = httpMock.expectOne(PerfilInicialService.URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      nombreVisible: 'Ana',
      preferencias: { idioma: 'ESPANOL', moneda: 'CRC', unidades: 'METRICO' },
    });
    req.flush({ ...perfilIndividual, configuracionCompleta: true, redirect: '/panel' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(navegar).toHaveBeenCalledWith('/panel');
  });

  it('el administrador envía también los datos de empresa', () => {
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    flushCarga({ ...perfilIndividual, rol: 'ADMINISTRADOR_EMPRESA', empresa });

    botonGuardar().click();
    const req = httpMock.expectOne(PerfilInicialService.URL);
    expect(req.request.body.empresa).toEqual({
      sectorIndustrial: 'AGROINDUSTRIA',
      pais: 'Costa Rica',
      cantidadEmpleados: 10,
    });
    req.flush({ ...perfilIndividual, configuracionCompleta: true, redirect: '/empresa/panel' });
  });

  it('si la carga del perfil falla muestra el error con reintento y no renderiza el formulario', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(PerfilInicialService.URL)
      .flush({ message: 'error' }, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="error-carga"]')).not.toBeNull();
    expect(inputNombre()).toBeNull();
    expect(botonGuardar()).toBeNull();
  });

  it('el botón de reintento vuelve a pedir el perfil y muestra el formulario al recuperarse', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(PerfilInicialService.URL)
      .flush({ message: 'error' }, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const reintentar: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="reintentar-perfil"] button'
    );
    reintentar.click();
    fixture.detectChanges();

    httpMock.expectOne(PerfilInicialService.URL).flush(perfilIndividual);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="error-carga"]')).toBeNull();
    expect(inputNombre().value).toBe('Ana');
  });

  it('el administrador no envía el PUT si limpia país, sector o empleados y ve errores inline', () => {
    flushCarga({
      ...perfilIndividual,
      rol: 'ADMINISTRADOR_EMPRESA',
      empresa: { ...empresa, sectorIndustrial: null, pais: '', cantidadEmpleados: 0 },
    });

    botonGuardar().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Selecciona un sector industrial.');
    expect(fixture.nativeElement.textContent).toContain('Ingresa un país de hasta 100 caracteres.');
    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa un número de empleados mayor que 0.'
    );
    httpMock.expectNone(PerfilInicialService.URL);
  });

  it('si la persistencia falla muestra el toast de error y permanece en la pantalla', async () => {
    const navegar = vi.spyOn(router, 'navigateByUrl');
    flushCarga(perfilIndividual);

    botonGuardar().click();
    httpMock
      .expectOne(PerfilInicialService.URL)
      .flush({ message: 'error' }, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    const titulos = toastService.toasts().map((t) => t.title);
    expect(titulos).toContain('No se pudo guardar tu perfil. Intenta nuevamente.');
    expect(navegar).not.toHaveBeenCalled();
    expect(botonGuardar().disabled).toBe(false);
  });
});
