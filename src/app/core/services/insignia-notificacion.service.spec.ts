import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { InsigniaNotificacionService } from './insignia-notificacion.service';
import { InsigniasEcoRutaService } from './insignias-ecoruta.service';
import { InsigniaEcoRuta } from '../models/insignia-ecoruta.model';

function insignia(idInsignia: number, nombre = `Insignia ${idInsignia}`): InsigniaEcoRuta {
  return {
    idInsignia,
    nombre,
    descripcion: `Descripción de ${nombre}`,
    eventoDesbloqueo: `evento_${idInsignia}`,
    fechaObtencion: '2026-08-08T12:00:00Z',
  };
}

describe('InsigniaNotificacionService', () => {
  let service: InsigniaNotificacionService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(InsigniaNotificacionService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  function flushListado(insignias: InsigniaEcoRuta[]): void {
    httpMock.expectOne(InsigniasEcoRutaService.URL).flush(insignias);
  }

  it('muestra la notificación cuando aparece una insignia nueva', async () => {
    vi.useFakeTimers();

    const promesaRevision = service.revisarConReintentos(new Set([1]));
    await vi.advanceTimersByTimeAsync(1500);
    flushListado([insignia(1), insignia(2)]);
    await promesaRevision;

    expect(service.pendientes()).toEqual([insignia(2)]);
  });

  it('no muestra nada cuando la insignia ya estaba registrada antes', async () => {
    vi.useFakeTimers();

    // Como nunca aparece nada nuevo, el servicio agota los 3 intentos
    // (1.5s / 3s / 5s) antes de rendirse.
    const promesaRevision = service.revisarConReintentos(new Set([1, 2]));
    await vi.advanceTimersByTimeAsync(1500);
    flushListado([insignia(1), insignia(2)]);
    await vi.advanceTimersByTimeAsync(3000);
    flushListado([insignia(1), insignia(2)]);
    await vi.advanceTimersByTimeAsync(5000);
    flushListado([insignia(1), insignia(2)]);
    await promesaRevision;

    expect(service.pendientes()).toEqual([]);
  });

  it('encola varias insignias nuevas y las muestra de forma secuencial', async () => {
    vi.useFakeTimers();

    const promesaRevision = service.revisarConReintentos(new Set());
    await vi.advanceTimersByTimeAsync(1500);
    flushListado([insignia(1), insignia(2)]);
    await promesaRevision;

    expect(service.pendientes()).toEqual([insignia(1), insignia(2)]);

    service.descartarActual();
    expect(service.pendientes()).toEqual([insignia(2)]);

    service.descartarActual();
    expect(service.pendientes()).toEqual([]);
  });

  it('reintenta a los 3s y 5s si el primer intento no trae nada nuevo', async () => {
    vi.useFakeTimers();

    const promesaRevision = service.revisarConReintentos(new Set([1]));

    await vi.advanceTimersByTimeAsync(1500);
    flushListado([insignia(1)]); // primer intento: nada nuevo

    await vi.advanceTimersByTimeAsync(3000);
    flushListado([insignia(1), insignia(2)]); // segundo intento: aparece la nueva

    await promesaRevision;

    expect(service.pendientes()).toEqual([insignia(2)]);
  });

  it('no revisa nada si el snapshot de antes falló (idsPrevios null)', async () => {
    await service.revisarConReintentos(null);

    expect(service.pendientes()).toEqual([]);
    httpMock.expectNone(InsigniasEcoRutaService.URL);
  });

  it('descarta todas las insignias pendientes al cambiar de ruta', async () => {
    vi.useFakeTimers();

    const promesaRevision = service.revisarConReintentos(new Set());
    await vi.advanceTimersByTimeAsync(1500);
    flushListado([insignia(1)]);
    await promesaRevision;

    expect(service.pendientes()).toEqual([insignia(1)]);

    // NavigationStart se emite antes de intentar resolver la ruta, así que la
    // notificación ya debería descartarse aunque la ruta en sí no exista en
    // este `provideRouter([])` de prueba; se captura el rechazo para no
    // ensuciar el run con un "Unhandled Rejection".
    void router.navigateByUrl('/cualquier-ruta').catch(() => undefined);
    await Promise.resolve();

    expect(service.pendientes()).toEqual([]);
  });
});
