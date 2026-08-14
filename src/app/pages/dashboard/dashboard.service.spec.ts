import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it("exporta el reporte PDF con responseType 'blob'", () => {
    service.exportarReportePdf(2026, 7).subscribe((blob) => {
      expect(blob.type).toBe('application/pdf');
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/emisiones/reporte/pdf?anio=2026&mes=7`
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.get('anio')).toBe('2026');
    expect(req.request.params.get('mes')).toBe('7');

    req.flush(new Blob(['pdf'], { type: 'application/pdf' }));
  });

  it('consulta el resumen de huella con el periodo y anio como query params', () => {
    service.obtenerResumenHuella('mes_actual', 2021).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/dashboard/huella?periodo=mes_actual&anio=2021`
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('periodo')).toBe('mes_actual');
    expect(req.request.params.get('anio')).toBe('2021');

    req.flush({
      periodoSeleccionado: 'mes_actual',
      huellaTotalT: 5.236,
      variacionPorcentual: 30.9,
      tieneDatos: true,
    });
  });

  it('consulta el resumen de certificaciones del dashboard', () => {
    service.obtenerResumenCertificaciones().subscribe((resumen) => {
      expect(resumen.activas).toBe(5);
      expect(resumen.proximasAVencer).toBe(3);
      expect(resumen.vencidas).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/certificaciones`);
    expect(req.request.method).toBe('GET');

    req.flush({ activas: 5, proximasAVencer: 3, vencidas: 1 });
  });

  it('consulta el calendario de vencimientos con el mes como query param', () => {
    service.obtenerCalendarioVencimientos('2026-07').subscribe((calendario) => {
      expect(calendario.mesVisualizado).toBe('2026-07');
      expect(calendario.vencimientosPorFecha['2026-07-18']).toHaveLength(1);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/calendario?mes=2026-07`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('mes')).toBe('2026-07');

    req.flush({
      mesVisualizado: '2026-07',
      vencimientosPorFecha: {
        '2026-07-18': [{ id: 'abc', nombre: 'Carbono Neutral', urgencia: '30_dias' }],
      },
    });
  });

  it('consulta las alertas activas del dashboard', () => {
    service.obtenerAlertas().subscribe((alertas) => {
      expect(alertas[0].urgencia).toBe('vencida');
      expect(alertas[0].diasRestantes).toBe(-24);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/alertas`);
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        idCertificacion: 'abc',
        nombre: 'Bandera Azul Ecológica 2025',
        fechaVencimiento: '2026-06-04',
        diasRestantes: -24,
        urgencia: 'vencida',
      },
    ]);
  });

  it('consulta la recomendación de renovación del dashboard', () => {
    service.obtenerRecomendacion().subscribe((recomendacion) => {
      expect(recomendacion?.nombreCertificacion).toBe('GHG Protocol — Corporate Standard');
      expect(recomendacion?.justificacion).toContain('Vence en 5 días');
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/recomendacion`);
    expect(req.request.method).toBe('GET');

    req.flush({
      idCertificacion: 'c1',
      nombreCertificacion: 'GHG Protocol — Corporate Standard',
      fechaVencimiento: '2026-07-03',
      diasRestantes: 5,
      impactoHuellaT: 120.5,
      justificacion: 'Vence en 5 días y respalda 3 de tus insignias activas.',
      sugerenciaAccion: 'Renovarla ahora evita perder tu nivel Oro.',
    });
  });

  it('devuelve null cuando no hay certificaciones con alerta activa', () => {
    service.obtenerRecomendacion().subscribe((recomendacion) => {
      expect(recomendacion).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/recomendacion`);
    req.flush(null);
  });

  it('lista las insignias empresariales del dashboard', () => {
    service.listarInsignias().subscribe((insignias) => {
      expect(insignias[0].nivelInsignia).toBe('bronce');
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/insignias`);
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        idInsignia: 1,
        nivelInsignia: 'bronce',
        nombre: 'Carbono Neutral',
        descripcion: 'Insignia activa verificable.',
        fechaObtencion: '2026-01-15T00:00:00Z',
      },
    ]);
  });
});
