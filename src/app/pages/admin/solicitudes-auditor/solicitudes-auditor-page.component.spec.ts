import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { SolicitudesAuditorPageComponent } from './solicitudes-auditor-page.component';
import {
  PaginaSolicitudes,
  SolicitudPendiente,
  ValidacionService,
} from '../../../core/validacion/validacion.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('SolicitudesAuditorPageComponent', () => {
  let fixture: ComponentFixture<SolicitudesAuditorPageComponent>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let validacionService: {
    listarPendientes: ReturnType<typeof vi.fn>;
  };

  const solicitud: SolicitudPendiente = {
    id: 'sol-1',
    nombreAuditor: 'Ana Mora',
    email: 'ana@correo.com',
    fechaSolicitud: '2026-07-14T00:00:00Z',
  };

  const pagina: PaginaSolicitudes = {
    contenido: [solicitud],
    pagina: 0,
    totalPaginas: 1,
    totalElementos: 1,
  };

  beforeEach(async () => {
    validacionService = { listarPendientes: vi.fn().mockReturnValue(of(pagina)) };

    await TestBed.configureTestingModule({
      imports: [SolicitudesAuditorPageComponent],
      providers: [
        provideRouter([]),
        { provide: ValidacionService, useValue: validacionService },
        ToastService,
      ],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(SolicitudesAuditorPageComponent);
    fixture.detectChanges();
  });

  it('pinta la tabla con las solicitudes pendientes', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent;

    expect(texto).toContain('Ana Mora');
    expect(texto).toContain('ana@correo.com');
  });

  it('sin solicitudes muestra el mensaje de vacio', () => {
    validacionService.listarPendientes.mockReturnValue(
      of({ contenido: [], pagina: 0, totalPaginas: 0, totalElementos: 0 })
    );
    fixture = TestBed.createComponent(SolicitudesAuditorPageComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No hay solicitudes pendientes en este momento.'
    );
  });

  it('si falla la carga inicial muestra el error con reintentar y no el vacio', () => {
    validacionService.listarPendientes.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture = TestBed.createComponent(SolicitudesAuditorPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { errorCarga(): boolean };
    const html = fixture.nativeElement as HTMLElement;

    expect(comp.errorCarga()).toBe(true);
    expect(html.textContent).toContain('No pudimos cargar las solicitudes. Intenta nuevamente.');
    expect(html.textContent).not.toContain('No hay solicitudes pendientes en este momento.');
  });

  it('al hacer clic en Revisar navega al detalle de la solicitud con la pagina actual', () => {
    const boton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button')
    ).find((b) => b.textContent?.includes('Revisar')) as HTMLButtonElement;
    boton.click();

    expect(navigate).toHaveBeenCalledWith(['/admin/solicitudes-auditor/sol-1'], {
      queryParams: { pagina: 0 },
    });
  });

  it('al resolver la ultima solicitud de una pagina, retrocede a la anterior', () => {
    validacionService.listarPendientes.mockImplementation((numeroPagina: number) =>
      numeroPagina === 2
        ? of({ contenido: [], pagina: 2, totalPaginas: 2, totalElementos: 20 })
        : of({ contenido: [solicitud], pagina: numeroPagina, totalPaginas: 3, totalElementos: 20 })
    );
    const interno = fixture.componentInstance as unknown as { cargar(numeroPagina: number): void };

    interno.cargar(2);

    expect(validacionService.listarPendientes).toHaveBeenLastCalledWith(1);
  });

  it('con un numero de pagina muy adelante (bookmark viejo), salta directo a la ultima pagina con contenido en una sola llamada extra', () => {
    validacionService.listarPendientes.mockImplementation((numeroPagina: number) =>
      numeroPagina === 9
        ? of({ contenido: [], pagina: 9, totalPaginas: 2, totalElementos: 20 })
        : of({ contenido: [solicitud], pagina: numeroPagina, totalPaginas: 2, totalElementos: 20 })
    );
    const interno = fixture.componentInstance as unknown as { cargar(numeroPagina: number): void };
    validacionService.listarPendientes.mockClear();

    interno.cargar(9);

    expect(validacionService.listarPendientes).toHaveBeenCalledTimes(2);
    expect(validacionService.listarPendientes).toHaveBeenLastCalledWith(1);
  });
});
