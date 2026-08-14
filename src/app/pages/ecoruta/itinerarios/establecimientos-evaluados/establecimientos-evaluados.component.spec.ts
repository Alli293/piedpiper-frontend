import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstablecimientoBannerService } from '../establecimiento-banner.service';
import { EstablecimientoEcoScore } from '../models/establecimiento-ecoscore.model';
import { EstablecimientosEvaluadosComponent } from './establecimientos-evaluados.component';

const PUNTUACION_MOCK = {
  puntuacionTotal: 68,
  componenteCertificaciones: 30,
  componenteIma: 24,
  componenteBenchmark: 14,
  cantidadCertificacionesActivas: 3,
  estimado: false,
};

const EMPRESA_ID_CR = '11111111-1111-1111-1111-111111111111';
const EMPRESA_ID_PA = '22222222-2222-2222-2222-222222222222';

const ESTABLECIMIENTO_CON_EMPRESA: EstablecimientoEcoScore = {
  nombreEstablecimiento: 'Hotel Capitán Suizo',
  empresaId: EMPRESA_ID_CR,
  puntuacionAmbiental: PUNTUACION_MOCK,
};

const ESTABLECIMIENTO_SIN_EMPRESA: EstablecimientoEcoScore = {
  nombreEstablecimiento: 'Soda El Buen Comer',
  empresaId: null,
  puntuacionAmbiental: PUNTUACION_MOCK,
};

describe('EstablecimientosEvaluadosComponent', () => {
  let fixture: ComponentFixture<EstablecimientosEvaluadosComponent>;
  let httpMock: HttpTestingController;

  async function crearFixture(
    establecimientos: EstablecimientoEcoScore[]
  ): Promise<ComponentFixture<EstablecimientosEvaluadosComponent>> {
    await TestBed.configureTestingModule({
      imports: [EstablecimientosEvaluadosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const created = TestBed.createComponent(EstablecimientosEvaluadosComponent);
    created.componentRef.setInput('establecimientos', establecimientos);
    return created;
  }

  function flushBanner(empresaId: string, banner: unknown): void {
    const req = httpMock.expectOne(`${EstablecimientoBannerService.URL}/${empresaId}/banner`);
    expect(req.request.method).toBe('GET');
    req.flush({ banner });
  }

  afterEach(() => {
    httpMock?.verify();
  });

  describe('banner visible', () => {
    it('muestra la bandera y el nombre del país cuando el establecimiento tiene empresaId', async () => {
      fixture = await crearFixture([ESTABLECIMIENTO_CON_EMPRESA]);
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushBanner(EMPRESA_ID_CR, {
        nombrePais: 'Costa Rica',
        banderaEmoji: '🇨🇷',
        banderaUrlSvg: 'https://flagcdn.com/cr.svg',
        codigoIso: 'CR',
      });
      await fixture.whenStable();
      fixture.detectChanges();

      const banner = fixture.nativeElement.querySelector('.ch-origen-banner');
      expect(banner).not.toBeNull();
      expect(banner.textContent).toContain('Costa Rica');
    });
  });

  describe('sin país registrado', () => {
    it('no renderiza banner y la ficha sigue visible cuando el establecimiento no tiene empresaId', async () => {
      fixture = await crearFixture([ESTABLECIMIENTO_SIN_EMPRESA]);
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Soda El Buen Comer');
      expect(fixture.nativeElement.querySelector('.ch-origen-banner')).toBeNull();
    });

    it('no hace ninguna petición de banner cuando ningún establecimiento tiene empresaId', async () => {
      fixture = await crearFixture([ESTABLECIMIENTO_SIN_EMPRESA]);
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      await fixture.whenStable();

      httpMock.verify(); // no debe quedar ninguna petición pendiente
    });
  });

  describe('filtro por país', () => {
    it('muestra solo los establecimientos del país seleccionado al activar el filtro', async () => {
      const establecimientoPanama: EstablecimientoEcoScore = {
        nombreEstablecimiento: 'Eco Lodge Boquete',
        empresaId: EMPRESA_ID_PA,
        puntuacionAmbiental: PUNTUACION_MOCK,
      };

      fixture = await crearFixture([ESTABLECIMIENTO_CON_EMPRESA, establecimientoPanama]);
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushBanner(EMPRESA_ID_CR, {
        nombrePais: 'Costa Rica',
        banderaEmoji: '🇨🇷',
        banderaUrlSvg: 'https://flagcdn.com/cr.svg',
        codigoIso: 'CR',
      });
      flushBanner(EMPRESA_ID_PA, {
        nombrePais: 'Panamá',
        banderaEmoji: '🇵🇦',
        banderaUrlSvg: 'https://flagcdn.com/pa.svg',
        codigoIso: 'PA',
      });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(
        fixture.nativeElement.querySelectorAll('.ch-establecimientos-evaluados__item').length
      ).toBe(2);

      const root = fixture.nativeElement as HTMLElement;
      const botones = Array.from(
        root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item')
      );
      const botonCostaRica = botones.find((boton) => boton.textContent?.includes('Costa Rica'));
      expect(botonCostaRica).toBeDefined();
      botonCostaRica!.click();
      fixture.detectChanges();

      const items = root.querySelectorAll('.ch-establecimientos-evaluados__item');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Hotel Capitán Suizo');
      expect(items[0].textContent).not.toContain('Eco Lodge Boquete');
    });
  });

  describe('REST Countries no disponible', () => {
    it('omite el banner de ese establecimiento pero el resto de la ficha se carga normalmente', async () => {
      fixture = await crearFixture([ESTABLECIMIENTO_CON_EMPRESA]);
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      const req = httpMock.expectOne(`${EstablecimientoBannerService.URL}/${EMPRESA_ID_CR}/banner`);
      req.flush({ message: 'timeout' }, { status: 504, statusText: 'Gateway Timeout' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Hotel Capitán Suizo');
      expect(fixture.nativeElement.querySelector('.ch-origen-banner')).toBeNull();
    });

    it('omite el banner cuando el backend responde 200 con banner null', async () => {
      fixture = await crearFixture([ESTABLECIMIENTO_CON_EMPRESA]);
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushBanner(EMPRESA_ID_CR, null);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Hotel Capitán Suizo');
      expect(fixture.nativeElement.querySelector('.ch-origen-banner')).toBeNull();
    });
  });
});
