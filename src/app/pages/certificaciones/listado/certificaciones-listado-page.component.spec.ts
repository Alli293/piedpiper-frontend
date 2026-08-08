import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CertificacionesListadoPageComponent } from './certificaciones-listado-page.component';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { environment } from '../../../../environments/environment';

describe('CertificacionesListadoPageComponent - filtro inicial por queryParam', () => {
  let fixture: ComponentFixture<CertificacionesListadoPageComponent>;
  let httpMock: HttpTestingController;
  let estadoQueryParam: string | null = null;
  const baseUrl = `${environment.apiBaseUrl}/certificaciones`;

  beforeEach(async () => {
    estadoQueryParam = null;
    await TestBed.configureTestingModule({
      imports: [CertificacionesListadoPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            // Closure sobre `estadoQueryParam`: cada `it` lo reasigna antes de
            // llamar a `crear()`, asi que el mock siempre lee el valor vigente.
            snapshot: { queryParamMap: { get: (_key: string) => estadoQueryParam } },
          },
        },
        // ShellLayoutComponent (usado en el template) inyecta PerfilInicialService
        // y dispara una petición HTTP al construirse; se stubea para que este
        // spec se enfoque solo en el filtro y no dependa de esa llamada.
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function crear(): void {
    fixture = TestBed.createComponent(CertificacionesListadoPageComponent);
    fixture.detectChanges();
    httpMock.expectOne(baseUrl).flush([]);
  }

  it('estado=vencida preselecciona el filtro VENCIDA', () => {
    estadoQueryParam = 'vencida';
    crear();
    expect((fixture.componentInstance as any).filtro()).toBe('VENCIDA');
  });

  it('estado=activa preselecciona el filtro VIGENTE', () => {
    estadoQueryParam = 'activa';
    crear();
    expect((fixture.componentInstance as any).filtro()).toBe('VIGENTE');
  });

  it('sin queryParam deja el filtro por defecto (TODAS)', () => {
    crear();
    expect((fixture.componentInstance as any).filtro()).toBe('TODAS');
  });

  it('estado=proxima_a_vencer no tiene chip propio: cae al filtro por defecto (TODAS)', () => {
    estadoQueryParam = 'proxima_a_vencer';
    crear();
    expect((fixture.componentInstance as any).filtro()).toBe('TODAS');
  });
});
