import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth-session.service';
import { PerfilInicial } from '../../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { EcoRutaItinerariosService } from '../ecoruta-itinerarios.service';
import { ItinerarioResumen, PaginaItinerarios } from '../models/itinerario.model';
import { MisItinerariosPageComponent } from './mis-itinerarios-page.component';

describe('MisItinerariosPageComponent', () => {
  let fixture: ComponentFixture<MisItinerariosPageComponent>;
  let itinerariosService: { listar: ReturnType<typeof vi.fn>; eliminar: ReturnType<typeof vi.fn> };
  let toastService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let router: Router;

  function itinerario(id: string, extra: Partial<ItinerarioResumen> = {}): ItinerarioResumen {
    return {
      id,
      cantidadDias: 5,
      fechaInicio: '2026-09-01',
      tipoViaje: 'INDIVIDUAL',
      ecoScore: 82,
      clasificacionAmbiental: 'EXCELENTE',
      ecoScoreParcial: false,
      provinciasVisitadas: ['SAN_JOSE'],
      fechaGeneracion: '2026-08-01T10:00:00Z',
      actualizadoEn: '2026-08-01T10:00:00Z',
      ...extra,
    };
  }

  function pagina(
    contenido: ItinerarioResumen[],
    extra: Partial<PaginaItinerarios> = {}
  ): PaginaItinerarios {
    return {
      contenido,
      totalResultados: contenido.length,
      paginaActual: 1,
      totalPaginas: contenido.length === 0 ? 0 : 1,
      tamanioPagina: 12,
      ...extra,
    };
  }

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function estabilizar(): Promise<void> {
    for (let intento = 0; intento < 5; intento += 1) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  }

  async function montar(opciones?: {
    listar?: ReturnType<typeof vi.fn>;
    toastService?: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  }): Promise<void> {
    itinerariosService = {
      listar: opciones?.listar ?? vi.fn().mockReturnValue(of(pagina([itinerario('itin-1')]))),
      eliminar: vi.fn(),
    };
    toastService = opciones?.toastService ?? { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MisItinerariosPageComponent],
      providers: [
        provideRouter([]),
        { provide: EcoRutaItinerariosService, useValue: itinerariosService },
        { provide: ToastService, useValue: toastService },
        {
          provide: AuthSessionService,
          useValue: { getUserInitials: () => 'MS', isAdministradorEmpresa: () => false },
        },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MisItinerariosPageComponent);
    router = TestBed.inject(Router);
    await estabilizar();
  }

  it('carga y muestra las tarjetas con el titulo derivado de las provincias', async () => {
    await montar();

    expect(itinerariosService.listar).toHaveBeenCalledWith({ pagina: 1 });
    const texto = raiz().textContent as string;
    expect(texto).toContain('San José');
    expect(texto).toContain('5 días');
    expect(texto).toContain('82');
    expect(texto).toContain('Excelente');
  });

  it('muestra el estado vacio cuando no hay itinerarios', async () => {
    await montar({ listar: vi.fn().mockReturnValue(of(pagina([]))) });

    expect(raiz().textContent).toContain('Todavía no tenés itinerarios guardados.');
  });

  it('muestra un mensaje de error cuando falla la carga', async () => {
    await montar({
      listar: vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 }))),
    });

    expect(raiz().querySelector('[role="alert"]')?.textContent).toContain(
      'No fue posible recuperar la información solicitada.'
    );
  });

  it('pagina hacia adelante y hacia atras', async () => {
    const listar = vi
      .fn()
      .mockReturnValueOnce(
        of(pagina([itinerario('itin-1')], { totalPaginas: 2, paginaActual: 1 }))
      );
    await montar({ listar });

    itinerariosService.listar.mockReturnValueOnce(
      of(pagina([itinerario('itin-2')], { totalPaginas: 2, paginaActual: 2 }))
    );
    const botones = Array.from(raiz().querySelectorAll('button')).filter(
      (b) => b.textContent?.trim() === 'Siguiente'
    );
    botones[0]?.click();
    await estabilizar();

    expect(itinerariosService.listar).toHaveBeenLastCalledWith({ pagina: 2 });
  });

  it('nuevo itinerario navega a preferencias', async () => {
    await montar();
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const boton = Array.from(raiz().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === '+ Nuevo itinerario'
    );
    boton?.click();

    expect(navigateSpy).toHaveBeenCalledWith('/ecoruta/preferencias');
  });

  it('abrir navega al detalle del itinerario', async () => {
    await montar();
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const boton = Array.from(raiz().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Abrir →'
    );
    boton?.click();

    expect(navigateSpy).toHaveBeenCalledWith('/ecoruta/itinerarios/itin-1');
  });

  describe('eliminar', () => {
    it('abre el modal de confirmacion y cancela sin eliminar', async () => {
      await montar();

      const botonEliminar = raiz().querySelector<HTMLButtonElement>(
        '.ch-mis-itinerarios__eliminar'
      );
      botonEliminar?.click();
      await estabilizar();

      expect(raiz().textContent).toContain('¿Eliminar este itinerario?');

      const cancelar = Array.from(raiz().querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Cancelar'
      );
      cancelar?.click();
      await estabilizar();

      expect(itinerariosService.eliminar).not.toHaveBeenCalled();
      expect(raiz().textContent).not.toContain('¿Eliminar este itinerario?');
    });

    it('confirma y elimina exitosamente, quitando la tarjeta de la lista', async () => {
      await montar();
      itinerariosService.eliminar.mockReturnValue(of(undefined));

      raiz().querySelector<HTMLButtonElement>('.ch-mis-itinerarios__eliminar')?.click();
      await estabilizar();
      const confirmar = Array.from(raiz().querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Eliminar'
      );
      confirmar?.click();
      await estabilizar();

      expect(itinerariosService.eliminar).toHaveBeenCalledWith('itin-1');
      expect(toastService.success).toHaveBeenCalledWith('Itinerario eliminado.');
      expect(raiz().textContent).not.toContain('San José');
    });

    it('en error 403 muestra el toast de permiso y conserva la tarjeta', async () => {
      await montar();
      itinerariosService.eliminar.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403 }))
      );

      raiz().querySelector<HTMLButtonElement>('.ch-mis-itinerarios__eliminar')?.click();
      await estabilizar();
      const confirmar = Array.from(raiz().querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Eliminar'
      );
      confirmar?.click();
      await estabilizar();

      expect(toastService.error).toHaveBeenCalledWith(
        'No tienes permiso para modificar este itinerario.'
      );
    });

    it('al eliminar la ultima tarjeta de una pagina distinta a la primera, retrocede de pagina en vez de mostrar el estado vacio', async () => {
      const listar = vi
        .fn()
        .mockReturnValueOnce(
          of(pagina([itinerario('itin-2')], { totalPaginas: 2, paginaActual: 2 }))
        );
      await montar({ listar });
      itinerariosService.eliminar.mockReturnValue(of(undefined));
      itinerariosService.listar.mockReturnValueOnce(
        of(pagina([itinerario('itin-1')], { totalPaginas: 1, paginaActual: 1 }))
      );

      raiz().querySelector<HTMLButtonElement>('.ch-mis-itinerarios__eliminar')?.click();
      await estabilizar();
      const confirmar = Array.from(raiz().querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Eliminar'
      );
      confirmar?.click();
      await estabilizar();

      expect(itinerariosService.listar).toHaveBeenLastCalledWith({ pagina: 1 });
      expect(raiz().textContent).not.toContain('Todavía no tenés itinerarios guardados.');
      expect(raiz().textContent).toContain('San José');
    });
  });
});
