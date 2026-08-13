import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
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

describe('CertificacionesListadoPageComponent - detalle en modal', () => {
  let fixture: ComponentFixture<CertificacionesListadoPageComponent>;
  let httpMock: HttpTestingController;
  let idQueryParam: string | null = null;
  const baseUrl = `${environment.apiBaseUrl}/certificaciones`;

  const CERT_RESUMEN = {
    id: 'c1',
    idAuditoria: 'a1',
    idEmpresa: 'e1',
    idAuditor: 'u1',
    tipo: 'CARBONO_NEUTRAL',
    nombreCertificacion: 'Carbono Neutral',
    fechaEmision: '2026-01-15T00:00:00Z',
    fechaVencimiento: '2027-01-15',
    estado: 'ACTIVA',
    vigente: true,
    urlVerificacion: 'https://carbonhub.example/api/certificaciones/c1/verificar',
    codigoVerificacion: 'CH-2026-8F4A19KD',
  };

  const CERT_DETALLE = {
    ...CERT_RESUMEN,
    recienEmitida: false,
    nombreAuditor: 'Ana Mora',
  };

  beforeEach(async () => {
    idQueryParam = null;
    await TestBed.configureTestingModule({
      imports: [CertificacionesListadoPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'id' ? idQueryParam : null),
              },
            },
          },
        },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // `whenStable()` no espera de forma confiable la cadena de microtareas
  // encadenadas dentro de `.then()` (carga de lista -> apertura automatica
  // del detalle por `?id=`); un macrotask vacio garantiza que el microtask
  // queue completo ya se proceso antes de continuar.
  function flushMicrotasks(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve));
  }

  async function crear(): Promise<void> {
    fixture = TestBed.createComponent(CertificacionesListadoPageComponent);
    fixture.detectChanges();
    httpMock.expectOne(baseUrl).flush([CERT_RESUMEN]);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function botonVerDetalle(root: HTMLElement): HTMLButtonElement | undefined {
    return Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Ver detalle')
    );
  }

  it('no muestra el modal hasta hacer click en "Ver detalle"', async () => {
    await crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('abre el modal con el detalle de la certificacion al hacer click en "Ver detalle"', async () => {
    await crear();
    const root = fixture.nativeElement as HTMLElement;

    botonVerDetalle(root)?.click();
    fixture.detectChanges();
    httpMock.expectOne(`${baseUrl}/c1`).flush(CERT_DETALLE);
    await fixture.whenStable();
    fixture.detectChanges();

    const modal = root.querySelector('app-modal') as HTMLElement;
    expect(modal.textContent).toContain('Carbono Neutral');
    expect(modal.textContent).toContain('CH-2026-8F4A19KD');
    expect(modal.textContent).toContain('Ana Mora');
  });

  it('navega a /verificar/:codigo al hacer clic en Verificar', async () => {
    await crear();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;

    botonVerDetalle(root)?.click();
    fixture.detectChanges();
    httpMock.expectOne(`${baseUrl}/c1`).flush(CERT_DETALLE);
    await fixture.whenStable();
    fixture.detectChanges();

    const boton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Verificar'
    );
    boton?.click();

    expect(navegar).toHaveBeenCalledWith(['/verificar', 'CH-2026-8F4A19KD']);
  });

  it('?id= abre automaticamente el modal de esa certificacion al cargar', async () => {
    idQueryParam = 'c1';
    fixture = TestBed.createComponent(CertificacionesListadoPageComponent);
    fixture.detectChanges();
    httpMock.expectOne(baseUrl).flush([CERT_RESUMEN]);
    await fixture.whenStable();
    await flushMicrotasks();
    fixture.detectChanges();
    httpMock.expectOne(`${baseUrl}/c1`).flush(CERT_DETALLE);
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-modal')?.textContent).toContain('Carbono Neutral');
  });

  it('?id= de una certificacion que no esta en el listado no abre el modal', async () => {
    idQueryParam = 'desconocido';
    fixture = TestBed.createComponent(CertificacionesListadoPageComponent);
    fixture.detectChanges();
    httpMock.expectOne(baseUrl).flush([CERT_RESUMEN]);
    await fixture.whenStable();
    await flushMicrotasks();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('cierra el modal al emitir close', async () => {
    await crear();
    const root = fixture.nativeElement as HTMLElement;
    botonVerDetalle(root)?.click();
    fixture.detectChanges();
    httpMock.expectOne(`${baseUrl}/c1`).flush(CERT_DETALLE);
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.componentInstance as any).cerrarDetalle();
    fixture.detectChanges();

    expect(root.querySelector('app-modal')).toBeNull();
  });

  it('al cerrar el modal limpia el ?id= de la URL', async () => {
    idQueryParam = 'c1';
    fixture = TestBed.createComponent(CertificacionesListadoPageComponent);
    fixture.detectChanges();
    httpMock.expectOne(baseUrl).flush([CERT_RESUMEN]);
    await fixture.whenStable();
    await flushMicrotasks();
    fixture.detectChanges();
    httpMock.expectOne(`${baseUrl}/c1`).flush(CERT_DETALLE);
    await fixture.whenStable();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    (fixture.componentInstance as any).cerrarDetalle();

    expect(navegar).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { id: null }, queryParamsHandling: 'merge' })
    );
  });
});
