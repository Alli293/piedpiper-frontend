import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionService } from '../../../core/auth-session.service';
import { InsigniasEcoRutaService } from '../../../core/services/insignias-ecoruta.service';
import { InsigniasEcoRutaPageComponent } from './insignias-ecoruta-page.component';

describe('InsigniasEcoRutaPageComponent', () => {
  let fixture: ComponentFixture<InsigniasEcoRutaPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsigniasEcoRutaPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: { getUserInitials: () => 'MS' },
        },
        {
          provide: AuthService,
          useValue: { cerrarSesion: vi.fn(), token: () => null },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InsigniasEcoRutaPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
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
  });

  it('muestra estado vacio cuando el usuario aun no tiene insignias', async () => {
    httpMock.expectOne(InsigniasEcoRutaService.URL).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aún no tenés insignias');
  });
});
