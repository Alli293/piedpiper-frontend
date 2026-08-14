import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionService } from '../../../core/auth-session.service';
import { InsigniasEcoRutaService } from '../../../core/services/insignias-ecoruta.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { ToastService } from '../../../shared/services/toast.service';
import { InsigniasEcoRutaPageComponent } from './insignias-ecoruta-page.component';

describe('InsigniasEcoRutaPageComponent', () => {
  let fixture: ComponentFixture<InsigniasEcoRutaPageComponent>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsigniasEcoRutaPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: { getUserInitials: () => 'MS', isAdministradorEmpresa: () => false },
        },
        {
          provide: AuthService,
          useValue: { cerrarSesion: vi.fn(), token: () => null },
        },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InsigniasEcoRutaPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('muestra las insignias obtenidas ordenadas y el detalle seleccionado', async () => {
    httpMock.expectOne(InsigniasEcoRutaService.URL).flush([
      {
        idInsignia: 1,
        nombre: 'Primer itinerario',
        descripcion: 'Creaste tu primer itinerario sostenible con EcoRuta.',
        eventoDesbloqueo: 'primer_itinerario_generado',
        fechaObtencion: '2026-05-10T16:00:00Z',
      },
      {
        idInsignia: 2,
        nombre: 'EcoScore Excelente',
        descripcion: 'Completaste tu primer itinerario sostenible.',
        eventoDesbloqueo: 'primer_itinerario_sostenible',
        fechaObtencion: '2026-07-15T20:32:00Z',
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Tus logros en EcoRuta');
    expect(texto).toContain('EcoScore Excelente');
    expect(texto).toContain('Primer itinerario');
    expect(texto).toContain('Insignia obtenida');
    expect(texto).toContain('Evento');
    expect(texto).toContain('primer_itinerario_sostenible');
    expect(texto).toContain('Seleccioná cualquier insignia obtenida');
    expect(texto).not.toContain('Itinerarios');
    expect(texto).not.toContain('Origen');
  });

  it('muestra estado vacio cuando el usuario aun no tiene insignias', async () => {
    httpMock.expectOne(InsigniasEcoRutaService.URL).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aún no tenés insignias');
  });
  it('muestra toast de permiso cuando la api responde 403', async () => {
    const errorSpy = vi.spyOn(toastService, 'error');

    httpMock
      .expectOne(InsigniasEcoRutaService.URL)
      .flush({}, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('permiso'));
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar tus insignias.');
  });

  it('muestra toast de insignias no encontradas cuando la api responde 404', async () => {
    const errorSpy = vi.spyOn(toastService, 'error');

    httpMock
      .expectOne(InsigniasEcoRutaService.URL)
      .flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No encontramos'));
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar tus insignias.');
  });
});
