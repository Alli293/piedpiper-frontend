import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { CertificacionesListadoPageComponent } from './certificaciones-listado-page.component';
import { environment } from '../../../../environments/environment';

describe('CertificacionesListadoPageComponent - filtro inicial por queryParam', () => {
  let fixture: ComponentFixture<CertificacionesListadoPageComponent>;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/certificaciones`;

  function crearComponente(estadoQueryParam: string | null): void {
    TestBed.configureTestingModule({
      imports: [CertificacionesListadoPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: (_key: string) => estadoQueryParam } },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(CertificacionesListadoPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne(baseUrl).flush([]);
  }

  afterEach(() => httpMock.verify());

  it('estado=vencida preselecciona el filtro VENCIDA', () => {
    crearComponente('vencida');
    expect((fixture.componentInstance as any).filtro()).toBe('VENCIDA');
  });

  it('estado=activa preselecciona el filtro VIGENTE', () => {
    crearComponente('activa');
    expect((fixture.componentInstance as any).filtro()).toBe('VIGENTE');
  });

  it('sin queryParam deja el filtro por defecto (TODAS)', () => {
    crearComponente(null);
    expect((fixture.componentInstance as any).filtro()).toBe('TODAS');
  });

  it('estado=proxima_a_vencer no tiene chip propio: cae al filtro por defecto (TODAS)', () => {
    crearComponente('proxima_a_vencer');
    expect((fixture.componentInstance as any).filtro()).toBe('TODAS');
  });
});
