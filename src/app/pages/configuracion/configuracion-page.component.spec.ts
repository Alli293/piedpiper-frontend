import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ConfiguracionPageComponent } from './configuracion-page.component';
import { PreferenciasService } from '../../core/services/preferencias.service';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Preferencias } from '../../core/models/preferencias.model';

describe('ConfiguracionPageComponent', () => {
  let fixture: ComponentFixture<ConfiguracionPageComponent>;
  let httpMock: HttpTestingController;
  let i18n: I18nService;
  let toastService: ToastService;

  const GUARDADAS: Preferencias = { idioma: 'ESPANOL', moneda: 'CRC', unidades: 'METRICO' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    i18n = TestBed.inject(I18nService);
    toastService = TestBed.inject(ToastService);

    fixture = TestBed.createComponent(ConfiguracionPageComponent);
    fixture.detectChanges(); // dispara ngOnInit → GET de preferencias
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushCargaInicial(preferencias: Preferencias = GUARDADAS): void {
    httpMock.expectOne(PreferenciasService.URL).flush(preferencias);
    fixture.detectChanges();
  }

  function selects(): NodeListOf<HTMLSelectElement> {
    return fixture.nativeElement.querySelectorAll('select');
  }

  function botonGuardar(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.ch-button__inner');
  }

  it('lee las preferencias del perfil y las aplica al render', () => {
    flushCargaInicial({ idioma: 'INGLES', moneda: 'USD', unidades: 'METRICO' });

    const [idioma, moneda, unidades] = Array.from(selects());
    expect(idioma.value).toBe('INGLES');
    expect(moneda.value).toBe('USD');
    expect(unidades.value).toBe('METRICO');
    expect(i18n.idioma()).toBe('INGLES');
  });

  it('muestra el spinner y deshabilita el botón durante el guardado', () => {
    flushCargaInicial();

    botonGuardar().click();
    fixture.detectChanges();

    expect(botonGuardar().disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.ch-button__spinner')).not.toBeNull();

    httpMock.expectOne(PreferenciasService.URL).flush(GUARDADAS);
    fixture.detectChanges();

    expect(botonGuardar().disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('.ch-button__spinner')).toBeNull();
  });

  it('al guardar un idioma nuevo la interfaz cambia de inmediato', () => {
    flushCargaInicial();

    const idiomaSelect = selects()[0];
    idiomaSelect.value = 'INGLES';
    idiomaSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    botonGuardar().click();
    const req = httpMock.expectOne(PreferenciasService.URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ idioma: 'INGLES', moneda: 'CRC', unidades: 'METRICO' });
    req.flush({ idioma: 'INGLES', moneda: 'CRC', unidades: 'METRICO' });
    fixture.detectChanges();

    expect(i18n.idioma()).toBe('INGLES');
    const titulo: HTMLElement = fixture.nativeElement.querySelector('.ch-configuracion__titulo');
    expect(titulo.textContent).toContain('Interface preferences');
  });

  it('si la persistencia falla muestra el toast de error y mantiene las preferencias previas', () => {
    flushCargaInicial();

    const idiomaSelect = selects()[0];
    idiomaSelect.value = 'INGLES';
    idiomaSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    botonGuardar().click();
    httpMock
      .expectOne(PreferenciasService.URL)
      .flush({ message: 'error' }, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const mensajes = toastService.toasts().map((t) => t.mensaje);
    expect(mensajes).toContain('No se pudieron guardar tus preferencias. Intenta nuevamente.');

    // La selección vuelve a las preferencias previas y el idioma no cambia.
    expect(selects()[0].value).toBe('ESPANOL');
    expect(i18n.idioma()).toBe('ESPANOL');
    expect(botonGuardar().disabled).toBe(false);
  });

  it('si la lectura inicial falla se mantienen los defaults Español / CRC / métrico', () => {
    httpMock
      .expectOne(PreferenciasService.URL)
      .flush({ message: 'error' }, { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    const [idioma, moneda, unidades] = Array.from(selects());
    expect(idioma.value).toBe('ESPANOL');
    expect(moneda.value).toBe('CRC');
    expect(unidades.value).toBe('METRICO');
  });
});
