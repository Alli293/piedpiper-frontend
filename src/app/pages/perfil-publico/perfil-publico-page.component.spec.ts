import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { Component, input } from '@angular/core';
import * as fc from 'fast-check';

import { PerfilPublicoPageComponent } from './perfil-publico-page.component';
import { PerfilPublicoService } from './perfil-publico.service';
import { PerfilPublicoDTO } from './perfil-publico.models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BusquedaPerfilComponent } from './busqueda-perfil/busqueda-perfil.component';
import { CertificacionesPublicasPageComponent } from './certificaciones/certificaciones-publicas-page.component';
import { environment } from '../../../environments/environment';

// --- Stub components to avoid importing real child components with complex deps ---
@Component({ selector: 'app-icon', template: '', standalone: true })
class IconStubComponent {
  name = input.required<string>();
  size = input(16);
}

@Component({ selector: 'app-busqueda-perfil', template: '', standalone: true })
class BusquedaPerfilStubComponent {}

@Component({ selector: 'app-certificaciones-publicas-page', template: '', standalone: true })
class CertificacionesPublicasStubComponent {
  slug = input.required<string>();
}

// --- Test data ---
const PERFIL_MOCK: PerfilPublicoDTO = {
  nombreEmpresa: 'EcoTech Solutions',
  logoUrl: 'https://example.com/logo.png',
  sectorIndustrial: 'Tecnología',
  pais: 'Costa Rica',
  nivelEcologico: 'Oro',
  fechaActualizacionNivel: '2025-03-15T14:30:00Z',
  certificacionesVigentes: 5,
  insigniasActivas: 3,
};

const PERFIL_SIN_NIVEL: PerfilPublicoDTO = {
  ...PERFIL_MOCK,
  nivelEcologico: 'Sin nivel',
  fechaActualizacionNivel: null,
  certificacionesVigentes: 0,
  insigniasActivas: 0,
};

describe('PerfilPublicoPageComponent', () => {
  let fixture: ComponentFixture<PerfilPublicoPageComponent>;
  let component: PerfilPublicoPageComponent;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/perfil-publico`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilPublicoPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PerfilPublicoService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (_key: string) => 'eco-tech' } },
          },
        },
      ],
    })
      .overrideComponent(PerfilPublicoPageComponent, {
        remove: {
          imports: [IconComponent, BusquedaPerfilComponent, CertificacionesPublicasPageComponent],
        },
        add: {
          imports: [IconStubComponent, BusquedaPerfilStubComponent, CertificacionesPublicasStubComponent],
        },
      })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PerfilPublicoPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.match(() => true);
  });

  function flushPerfil(dto: PerfilPublicoDTO): void {
    const req = httpMock.expectOne(`${baseUrl}/eco-tech`);
    req.flush(dto);
    fixture.detectChanges();
  }

  function flushError(status: number, body: object): void {
    const req = httpMock.expectOne(`${baseUrl}/eco-tech`);
    req.flush(body, { status, statusText: 'Error' });
    fixture.detectChanges();
  }

  // =========================================================================
  // Property Tests (fast-check)
  // =========================================================================

  describe('Property tests (fast-check)', () => {
    /**
     * Property 9: Formateo de fechas en locale es-CR
     * Para cualquier fecha válida ISO 8601, la función formatFecha() produce una cadena
     * que coincide con el formato es-CR (mes en español, formato 12h con a.m./p.m.).
     *
     * Validates: Requirements 4.3, 8.1
     */
    it('Property 9: formatFecha produce formato es-CR para cualquier fecha válida', () => {
      // Create component instance to access formatFecha
      fixture.detectChanges();
      httpMock.expectOne(`${baseUrl}/eco-tech`).flush(PERFIL_MOCK);

      fc.assert(
        fc.property(
          fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
          (randomDate) => {
            const isoStr = randomDate.toISOString();
            const result = component['formatFecha'](isoStr);

            // Must not be empty
            expect(result.length).toBeGreaterThan(0);

            // Verify structure: should contain a 2-digit day
            const dayMatch = result.match(/\d{1,2}/);
            expect(dayMatch).not.toBeNull();

            // Should contain Spanish month abbreviation (short month names in es-CR)
            const spanishMonths = [
              'ene', 'feb', 'mar', 'abr', 'may', 'jun',
              'jul', 'ago', 'sept', 'sep', 'oct', 'nov', 'dic',
            ];
            const containsMonth = spanishMonths.some((m) =>
              result.toLowerCase().includes(m)
            );
            expect(containsMonth).toBe(true);

            // Should contain year (4 digits)
            const yearMatch = result.match(/\d{4}/);
            expect(yearMatch).not.toBeNull();

            // Should contain time portion with a.m. or p.m.
            const hasAmPm = /[ap]\.\s?m\./.test(result) || /[AP]M/.test(result) || /[ap]\.?\s?m\.?/.test(result);
            expect(hasAmPm).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10: Formateo de números con separador de miles
     * Para cualquier número entero > 999, formatNumero() produce una cadena con
     * separador de miles del locale es-CR (espacio fino U+202F o espacio regular).
     *
     * Validates: Requirements 8.2
     */
    it('Property 10: formatNumero usa separador de miles para números > 999', () => {
      fixture.detectChanges();
      httpMock.expectOne(`${baseUrl}/eco-tech`).flush(PERFIL_MOCK);

      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 9999999 }),
          (num) => {
            const result = component['formatNumero'](num);

            // The result should not be empty
            expect(result.length).toBeGreaterThan(0);

            // Remove all non-digit characters to verify the digits are preserved
            const digitsOnly = result.replace(/\D/g, '');
            expect(digitsOnly).toBe(num.toString());

            // For numbers >= 1000, there should be a separator character
            // es-CR uses thin space (U+202F), non-breaking space (U+00A0), regular space, or period
            // The formatted string should be longer than the raw digits (due to separators)
            expect(result.length).toBeGreaterThan(digitsOnly.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // =========================================================================
  // Unit Tests
  // =========================================================================

  describe('Unit tests', () => {
    it('muestra spinner durante estado de carga', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const spinner = el.querySelector('.perfil-publico__spinner');
      const loadingText = el.querySelector('.perfil-publico__loading-text');

      expect(spinner).not.toBeNull();
      expect(loadingText?.textContent).toContain('Cargando perfil');
    });

    it('renderiza nombre, sector, país y nivel cuando la data carga exitosamente', () => {
      fixture.detectChanges();
      flushPerfil(PERFIL_MOCK);

      const el = fixture.nativeElement as HTMLElement;
      const nombre = el.querySelector('.perfil-publico__nombre');
      const sector = el.querySelector('.perfil-publico__sector');
      const pais = el.querySelector('.perfil-publico__pais');
      const nivel = el.querySelector('.perfil-publico__nivel-label');

      expect(nombre?.textContent).toContain('EcoTech Solutions');
      expect(sector?.textContent).toContain('Tecnología');
      expect(pais?.textContent).toContain('Costa Rica');
      expect(nivel?.textContent).toContain('Oro');
    });

    it('renderiza página 404 cuando ocurre un error 404', () => {
      fixture.detectChanges();
      flushError(404, { mensaje: 'El perfil que buscas no existe o ya no está disponible.' });

      const el = fixture.nativeElement as HTMLElement;
      const errorSection = el.querySelector('.perfil-publico__error--404');
      const errorMsg = el.querySelector('.perfil-publico__error-msg');

      expect(errorSection).not.toBeNull();
      expect(errorMsg?.textContent).toContain('El perfil que buscas no existe');
    });

    it('muestra mensaje "Sin nivel" cuando nivelEcologico es "Sin nivel"', () => {
      fixture.detectChanges();
      flushPerfil(PERFIL_SIN_NIVEL);

      const el = fixture.nativeElement as HTMLElement;
      const nivelMensaje = el.querySelector('.perfil-publico__nivel-mensaje');

      expect(nivelMensaje).not.toBeNull();
      expect(nivelMensaje?.textContent).toContain(
        'Esta empresa aún no cuenta con certificaciones vigentes.'
      );
    });

    it('oculta la línea de fecha cuando fechaActualizacionNivel es null', () => {
      fixture.detectChanges();
      flushPerfil(PERFIL_SIN_NIVEL);

      const el = fixture.nativeElement as HTMLElement;
      const fechaEl = el.querySelector('.perfil-publico__nivel-fecha');

      expect(fechaEl).toBeNull();
    });

    it('muestra la línea de fecha cuando fechaActualizacionNivel tiene valor', () => {
      fixture.detectChanges();
      flushPerfil(PERFIL_MOCK);

      const el = fixture.nativeElement as HTMLElement;
      const fechaEl = el.querySelector('.perfil-publico__nivel-fecha');

      expect(fechaEl).not.toBeNull();
      expect(fechaEl?.textContent).toContain('Actualizado:');
    });
  });
});
