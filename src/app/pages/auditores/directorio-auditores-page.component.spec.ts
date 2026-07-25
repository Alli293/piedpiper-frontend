import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthSessionService } from '../../core/auth-session.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuditoresService } from './auditores.service';
import { AuditorResumen, PaginaAuditores } from './auditor.model';
import { DirectorioAuditoresPageComponent } from './directorio-auditores-page.component';

describe('DirectorioAuditoresPageComponent', () => {
  let fixture: ComponentFixture<DirectorioAuditoresPageComponent>;
  let component: DirectorioAuditoresPageComponent;
  let auditoresService: {
    listar: ReturnType<typeof vi.fn>;
    obtenerEspecialidades: ReturnType<typeof vi.fn>;
    obtenerZonas: ReturnType<typeof vi.fn>;
  };
  let toastService: { error: ReturnType<typeof vi.fn> };

  const auditor: AuditorResumen = {
    auditorId: 'aud-1',
    nombre: 'Ana Mora',
    fotoPerfil: null,
    especialidadesPrincipales: ['AGROINDUSTRIA', 'ENERGIA_RENOVABLE'],
    calificacionPromedio: 4.5,
    totalResenas: 30,
    disponible: true,
    auditoriasCompletadas: 42,
    aniosExperiencia: 8,
    provincia: 'SAN_JOSE',
  };

  const paginaBase: PaginaAuditores = {
    contenido: [auditor],
    totalResultados: 1,
    paginaActual: 0,
    totalPaginas: 1,
  };

  async function montar(overrides?: {
    especialidades?: ReturnType<typeof vi.fn>;
    zonas?: ReturnType<typeof vi.fn>;
  }) {
    auditoresService = {
      listar: vi.fn().mockReturnValue(of(paginaBase)),
      obtenerEspecialidades:
        overrides?.especialidades ??
        vi.fn().mockReturnValue(of([{ valor: 'AGROINDUSTRIA', etiqueta: 'Agroindustria' }])),
      obtenerZonas:
        overrides?.zonas ??
        vi.fn().mockReturnValue(of([{ valor: 'SAN_JOSE', etiqueta: 'San José' }])),
    };
    toastService = { error: vi.fn(), toasts: signal([]) } as any;

    await TestBed.configureTestingModule({
      imports: [DirectorioAuditoresPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuditoresService, useValue: auditoresService },
        {
          provide: AuthSessionService,
          useValue: {
            getRole: vi.fn().mockReturnValue('administrador_empresa'),
            getUserName: vi.fn().mockReturnValue('Mock User'),
            isAdministradorEmpresa: vi.fn().mockReturnValue(true),
          },
        },
        {
          provide: AuthService,
          useValue: { cerrarSesion: vi.fn(), token: signal<string | null>(null) },
        },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectorioAuditoresPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function comp() {
    return component as unknown as {
      resultado: { set(v: PaginaAuditores | null): void };
      cargando: { set(v: boolean): void };
      error: { (): boolean; set(v: boolean): void };
      modelo(): { pagina: number; especialidades: string[] };
      onBuscar(v: string): void;
      onOrdenar(v: string): void;
      avisoBusqueda(): string;
      mensajeError(): string;
      tarjetas(): { iniciales: string; estrellas: boolean[]; ubicacion: string }[];
      toggleEspecialidad(v: string, activa: boolean): void;
      onZona(v: string | null): void;
      onSoloDisponibles(v: boolean): void;
      limpiarFiltros(): void;
      irAPagina(n: number): void;
      chipsActivos(): { tipo: string; valor: string; etiqueta: string }[];
      hayFiltrosActivos(): boolean;
      especialidadesDeshabilitadas(): boolean;
      zonasDeshabilitadas(): boolean;
      reintentar(): void;
    };
  }

  function pintar() {
    comp().cargando.set(false);
    fixture.detectChanges();
  }

  it('consulta el directorio al iniciar con los criterios por defecto', async () => {
    await montar();

    await vi.waitFor(() =>
      expect(auditoresService.listar).toHaveBeenCalledWith({
        terminoBusqueda: '',
        especialidades: [],
        zonaGeografica: null,
        calificacionMinima: null,
        soloDisponibles: false,
        pagina: 0,
        ordenamiento: 'CALIFICACION',
      })
    );
  });

  it('carga los catalogos de especialidades y zonas al iniciar', async () => {
    await montar();

    expect(auditoresService.obtenerEspecialidades).toHaveBeenCalled();
    expect(auditoresService.obtenerZonas).toHaveBeenCalled();
  });

  it('al aplicar un filtro aparece su chip y reinicia la pagina', async () => {
    await montar();
    comp().irAPagina(2);

    comp().toggleEspecialidad('AGROINDUSTRIA', true);

    expect(comp().hayFiltrosActivos()).toBe(true);
    expect(
      comp()
        .chipsActivos()
        .map((c) => c.etiqueta)
    ).toContain('Agroindustria');
    expect(comp().modelo().pagina).toBe(0);
  });

  it('quitar un chip remueve ese filtro y conserva los demas', async () => {
    await montar();
    comp().toggleEspecialidad('AGROINDUSTRIA', true);
    comp().onSoloDisponibles(true);
    pintar();
    expect(comp().chipsActivos()).toHaveLength(2);

    const quitar = (fixture.nativeElement as HTMLElement).querySelector(
      '.ch-directorio__chip-quitar'
    ) as HTMLButtonElement;
    quitar.click();
    fixture.detectChanges();

    expect(comp().chipsActivos()).toHaveLength(1);
    expect(comp().chipsActivos()[0].etiqueta).toBe('Solo disponibles');
    expect(comp().modelo().especialidades).toHaveLength(0);
  });

  it('limpiar filtros quita todos los chips activos', async () => {
    await montar();
    comp().toggleEspecialidad('AGROINDUSTRIA', true);
    comp().onZona('SAN_JOSE');
    comp().onSoloDisponibles(true);
    expect(comp().chipsActivos()).toHaveLength(3);

    comp().limpiarFiltros();

    expect(comp().chipsActivos()).toHaveLength(0);
    expect(comp().hayFiltrosActivos()).toBe(false);
  });

  it('con filtros activos y sin resultados muestra el mensaje de ampliar criterios', async () => {
    await montar();
    comp().onZona('SAN_JOSE');
    comp().resultado.set({ contenido: [], totalResultados: 0, paginaActual: 0, totalPaginas: 0 });
    pintar();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No hay auditores que cumplan con los filtros seleccionados. Intente ampliar los criterios.'
    );
  });

  it('el mensaje de error cambia cuando hay filtros activos', async () => {
    await montar();

    expect(comp().mensajeError()).toBe(
      'No se pudo cargar el directorio de auditores. Intente nuevamente.'
    );

    comp().onSoloDisponibles(true);

    expect(comp().mensajeError()).toBe('No se pudo aplicar el filtro. Intente nuevamente.');
  });

  it('si falla un catalogo se deshabilita ese filtro y los demas siguen disponibles', async () => {
    await montar({
      especialidades: vi.fn().mockReturnValue(throwError(() => new Error('network'))),
    });
    await vi.waitFor(() => expect(comp().especialidadesDeshabilitadas()).toBe(true));
    fixture.detectChanges();

    expect(comp().zonasDeshabilitadas()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Catálogo no disponible.');
    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo cargar el catálogo de especialidades. Los demás filtros están disponibles.',
      undefined,
      5000
    );
  });

  it('reintentar vuelve a consultar el directorio', async () => {
    await montar();
    await vi.waitFor(() => expect(auditoresService.listar).toHaveBeenCalledTimes(1));

    comp().reintentar();

    await vi.waitFor(() => expect(auditoresService.listar).toHaveBeenCalledTimes(2));
  });

  it('mientras carga muestra el estado de carga', async () => {
    await montar();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando auditores...');
  });

  it('pinta una tarjeta por cada auditor con nombre y auditorias', async () => {
    await montar();
    comp().resultado.set(paginaBase);
    pintar();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelectorAll('.ch-auditor-card')).toHaveLength(1);
    expect(html.textContent).toContain('Ana Mora');
    expect(html.textContent).toContain('42');
    expect(html.querySelector('.ch-auditor-card')?.getAttribute('href')).toBe('/auditores/aud-1');
  });

  it('con lista vacia muestra el texto de sin resultados', async () => {
    await montar();
    comp().resultado.set({ contenido: [], totalResultados: 0, paginaActual: 0, totalPaginas: 0 });
    pintar();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No se encontraron auditores que coincidan con tu búsqueda.'
    );
  });

  it('ante un error muestra el aviso con reintentar', async () => {
    await montar();
    comp().error.set(true);
    pintar();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar el directorio de auditores'
    );
    expect(html.textContent).toContain('Reintentar');
  });

  it('si la consulta falla activa el error y muestra el toast con el mensaje del backend', async () => {
    await montar();
    auditoresService.listar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'El servicio no está disponible.' },
          })
      )
    );

    comp().reintentar();

    await vi.waitFor(() => expect(comp().error()).toBe(true));
    expect(toastService.error).toHaveBeenCalledWith(
      'El servicio no está disponible.',
      undefined,
      5000
    );
  });

  it('si el error no trae mensaje cae al texto por defecto del directorio', async () => {
    await montar();
    auditoresService.listar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }))
    );

    comp().reintentar();

    await vi.waitFor(() => expect(comp().error()).toBe(true));
    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo cargar el directorio de auditores. Intente nuevamente.',
      undefined,
      5000
    );
  });

  it('un termino de un caracter muestra el aviso de minimo', async () => {
    await montar();

    comp().onBuscar('a');

    expect(comp().avisoBusqueda()).toBe('Ingrese al menos 2 caracteres para buscar.');
    expect(comp().modelo().pagina).toBe(0);
  });

  it('cambiar el orden reinicia a la primera pagina', async () => {
    await montar();
    comp().irAPagina(3);

    comp().onOrdenar('TIEMPO_RESPUESTA');

    expect(comp().modelo().pagina).toBe(0);
  });

  it('deriva iniciales, estrellas y ubicacion en el view model de la tarjeta', async () => {
    await montar();
    comp().resultado.set(paginaBase);

    const tarjeta = comp().tarjetas()[0];

    expect(tarjeta.iniciales).toBe('AM');
    expect(tarjeta.estrellas.filter(Boolean)).toHaveLength(5);
    expect(tarjeta.ubicacion).toBe('San José · 8 años exp.');
  });
});
