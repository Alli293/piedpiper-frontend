import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EstablecimientoBannerService } from './establecimiento-banner.service';
import { EstablecimientoBannerResponse } from './models/origen-banner.model';

describe('EstablecimientoBannerService', () => {
  let service: EstablecimientoBannerService;
  let httpMock: HttpTestingController;

  const empresaId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EstablecimientoBannerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('hace GET a /establecimientos/{empresaId}/banner', () => {
    const mockResponse: EstablecimientoBannerResponse = {
      banner: {
        nombrePais: 'Costa Rica',
        banderaEmoji: '🇨🇷',
        banderaUrlSvg: 'https://flagcdn.com/cr.svg',
        codigoIso: 'CR',
      },
    };

    let resultado: EstablecimientoBannerResponse | undefined;
    service.obtenerBanner(empresaId).subscribe((response) => (resultado = response));

    const req = httpMock.expectOne(`${EstablecimientoBannerService.URL}/${empresaId}/banner`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(resultado).toEqual(mockResponse);
  });

  it('propaga banner null cuando el backend no pudo resolver el país', () => {
    const mockResponse: EstablecimientoBannerResponse = { banner: null };

    let resultado: EstablecimientoBannerResponse | undefined;
    service.obtenerBanner(empresaId).subscribe((response) => (resultado = response));

    const req = httpMock.expectOne(`${EstablecimientoBannerService.URL}/${empresaId}/banner`);
    req.flush(mockResponse);

    expect(resultado?.banner).toBeNull();
  });

  it('usa el id de empresa correcto en la URL', () => {
    const otroId = '44444444-4444-4444-4444-444444444444';

    service.obtenerBanner(otroId).subscribe();

    const req = httpMock.expectOne(`${EstablecimientoBannerService.URL}/${otroId}/banner`);
    expect(req.request.method).toBe('GET');
    req.flush({ banner: null });
  });
});
