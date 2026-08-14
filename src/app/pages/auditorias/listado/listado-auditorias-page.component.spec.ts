import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth-session.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PaginaSolicitudesAuditoria, ResumenSolicitudAuditoria } from '../auditoria.model';
import { AuditoriasService } from '../auditorias.service';
import { ListadoAuditoriasPageComponent } from './listado-auditorias-page.component';

describe('ListadoAuditoriasPageComponent', () => {
  let fixture: ComponentFixture<ListadoAuditoriasPageComponent>;
  let auditoriasService: { listar: ReturnType<typeof vi.fn> };

  /** El backend responde una página; la pantalla no arma listas por su cuenta. */
  function pagina(
    contenido: ResumenSolicitudAuditoria[],
    extra: Partial<PaginaSolicitudesAuditoria> = {}
  ): PaginaSolicitudesAuditoria {
    return {
      contenido,
      totalResultados: contenido.length,
      paginaActual: 1,
      totalPaginas: contenido.length === 0 ? 0 : 1,
      tamanioPagina: 25,
      ...extra,
    };
  }

  const enRevision: ResumenSolicitudAuditoria = {
    id: 'sol-1',
    tipoCertificacion: 'INICIAL',
    periodoInicio: '2025-01-01',
    periodoFin: '2025-12-31',
    estado: 'EN_REVISION',
    estadoDescripcion: 'En revisión',
    fechaCreacion: '2026-06-02T14:32:00Z',
    nombreEmpresa: 'Café del Valle S.A.',
    idAuditor: 'aud-1',
    nombreAuditor: 'Ana Mora Vargas',
    fechaAsignacion: '2026-06-10T09:15:00Z',
    fechaAceptacion: '2026-06-10T09:20:00Z',
    cantidadDocumentos: 2,
  };

  const esperandoRespuesta: ResumenSolicitudAuditoria = {
    ...enRevision,
    id: 'sol-2',
    estado: 'SOLICITUD_ENVIADA',
    estadoDescripcion: 'Solicitud enviada',
    fechaAceptacion: null,
  };

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function filas(): HTMLElement[] {
    return Array.from(raiz().querySelectorAll('.ch-listado-auditorias__tabla tbody tr'));
  }

  async function estabilizar(): Promise<void> {
    for (let intento = 0; intento < 5; intento += 1) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
  }

  async function montar(perspectiva: 'empresa' | 'auditor' = 'empresa'): Promise<void> {
    fixture = TestBed.createComponent(ListadoAuditoriasPageComponent);
    fixture.componentRef.setInput('perspectiva', perspectiva);
    await estabilizar();
  }

  beforeEach(async () => {
    auditoriasService = {
      listar: vi.fn().mockReturnValue(of(pagina([esperandoRespuesta, enRevision]))),
    };

    await TestBed.configureTestingModule({
      imports: [ListadoAuditoriasPageComponent],
      providers: [
        provideRouter([]),
        ToastService,
        { provide: AuditoriasService, useValue: auditoriasService },
        {
          provide: AuthSessionService,
          useValue: {
            isAdministradorEmpresa: () => true,
            getRole: vi.fn().mockReturnValue('administrador_empresa'),
            getUserName: vi.fn().mockReturnValue('Admin'),
            getUserInitials: vi.fn().mockReturnValue('AD'),
            getUserId: vi.fn().mockReturnValue('u-1'),
          },
        },
        { provide: AuthService, useValue: { token: signal('fake-token'), cerrarSesion: vi.fn() } },
        { provide: SesionInactividadService, useValue: { reiniciar: vi.fn(), detener: vi.fn() } },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();
  });

  it('la empresa ve sus solicitudes con el auditor de cada una', async () => {
    await montar();

    expect(auditoriasService.listar).toHaveBeenCalled();
    expect(filas()).toHaveLength(2);
    expect(raiz().textContent).toContain('Ana Mora Vargas');
  });

  /**
   * El endpoint es el mismo para los dos roles: el backend resuelve de quién es el listado a
   * partir del token. Lo único que cambia en la pantalla es el encabezado y poder crear.
   */
  it('el auditor pide el mismo endpoint y no ve el boton de crear', async () => {
    await montar('auditor');

    expect(auditoriasService.listar).toHaveBeenCalled();
    expect(
      Array.from(raiz().querySelectorAll('button')).some(
        (b) => b.textContent?.trim() === '+ Nueva solicitud'
      )
    ).toBe(false);
  });

  /**
   * El orden lo fija el servidor por fecha de creación descendente, que es lo que pide la historia.
   * La pantalla no reordena: con paginación, reordenar solo la página visible daría un orden que
   * cambia de página en página.
   */
  it('respeta el orden en que vienen las filas del servidor', async () => {
    auditoriasService.listar.mockReturnValue(of(pagina([enRevision, esperandoRespuesta])));

    await montar();

    expect(filas()[0].textContent).toContain('En revisión');
    expect(filas()[1].textContent).toContain('Solicitud enviada');
  });

  it('un clic en Ver abre el detalle de esa solicitud', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await montar();

    filas()[0].querySelector('button')?.click();
    await estabilizar();

    expect(navegar).toHaveBeenCalledWith(['/empresa/auditorias', 'sol-2']);
  });

  /** El detalle es la misma pantalla, pero cada rol la abre bajo su propia sección. */
  it('el auditor abre el detalle bajo su propia ruta y no bajo la de empresa', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await montar('auditor');

    filas()[0].querySelector('button')?.click();
    await estabilizar();

    expect(navegar).toHaveBeenCalledWith(['/auditor/auditorias', 'sol-2']);
  });

  it('el boton de nueva solicitud lleva al formulario de creacion', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await montar();

    Array.from(raiz().querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === '+ Nueva solicitud')
      ?.click();
    await estabilizar();

    expect(navegar).toHaveBeenCalledWith('/empresa/auditorias/nueva');
  });

  it('sin solicitudes muestra el mensaje de estado vacio y no una tabla', async () => {
    auditoriasService.listar.mockReturnValue(of(pagina([])));

    await montar();

    expect(raiz().querySelector('.ch-listado-auditorias__vacio')?.textContent).toContain(
      'Aún no tienes solicitudes de auditoría registradas.'
    );
    expect(raiz().querySelector('.ch-listado-auditorias__tabla')).toBeNull();
  });

  /** Los chips viven en `app-filter-chips`; el primero es "Todos" y luego uno por estado filtrable. */
  function chipsEstado(): HTMLButtonElement[] {
    return Array.from(
      raiz().querySelectorAll<HTMLButtonElement>(
        '.ch-listado-auditorias__barra app-filter-chips button'
      )
    );
  }

  /** `indice` es la posicion del estado dentro de `ESTADOS_FILTRABLES` (0 = SOLICITUD_ENVIADA). */
  async function seleccionarEstado(indice: number): Promise<void> {
    chipsEstado()[indice + 1].click();
    await estabilizar();
  }

  async function seleccionarTodos(): Promise<void> {
    chipsEstado()[0].click();
    await estabilizar();
  }

  function botonPaginacion(texto: string): HTMLButtonElement | undefined {
    return Array.from(
      raiz().querySelectorAll<HTMLButtonElement>('.ch-listado-auditorias__paginador button')
    ).find((b) => b.textContent?.trim() === texto);
  }

  it('la primera carga pide la pagina 1 sin filtros', async () => {
    await montar();

    expect(auditoriasService.listar).toHaveBeenCalledWith({ filtroEstado: [], pagina: 1 });
  });

  it('elegir un estado lo envia como filtro al servidor', async () => {
    await montar();
    await seleccionarEstado(2);

    expect(auditoriasService.listar).toHaveBeenLastCalledWith({
      filtroEstado: ['EN_REVISION'],
      pagina: 1,
    });
  });

  it('elegir otro estado reemplaza el filtro anterior', async () => {
    await montar();
    await seleccionarEstado(2);
    await seleccionarEstado(3);

    expect(auditoriasService.listar).toHaveBeenLastCalledWith({
      filtroEstado: ['REPORTE_CARGADO'],
      pagina: 1,
    });
  });

  it('volver a "Todos" quita el filtro', async () => {
    await montar();
    await seleccionarEstado(2);
    await seleccionarTodos();

    expect(auditoriasService.listar).toHaveBeenLastCalledWith({ filtroEstado: [], pagina: 1 });
  });

  /**
   * Es el criterio de la historia: si el usuario está en la página 3 y filtra hasta dejar una sola,
   * seguiría pidiendo una página que ya no existe y vería la tabla vacía.
   */
  it('al aplicar un filtro la paginacion vuelve a la pagina 1', async () => {
    auditoriasService.listar.mockReturnValue(
      of(pagina([enRevision], { paginaActual: 2, totalPaginas: 3, totalResultados: 60 }))
    );
    await montar();

    botonPaginacion('Siguiente')?.click();
    await estabilizar();
    await seleccionarEstado(2);

    expect(auditoriasService.listar).toHaveBeenLastCalledWith({
      filtroEstado: ['EN_REVISION'],
      pagina: 1,
    });
  });

  it('el paginador pide la pagina siguiente y la anterior', async () => {
    auditoriasService.listar.mockReturnValue(
      of(pagina([enRevision], { paginaActual: 2, totalPaginas: 3, totalResultados: 60 }))
    );
    await montar();

    botonPaginacion('Siguiente')?.click();
    await estabilizar();
    expect(auditoriasService.listar).toHaveBeenLastCalledWith({ filtroEstado: [], pagina: 3 });

    botonPaginacion('Anterior')?.click();
    await estabilizar();
    expect(auditoriasService.listar).toHaveBeenLastCalledWith({ filtroEstado: [], pagina: 1 });
  });

  it('en la primera pagina el boton Anterior queda deshabilitado', async () => {
    auditoriasService.listar.mockReturnValue(
      of(pagina([enRevision], { paginaActual: 1, totalPaginas: 3, totalResultados: 60 }))
    );
    await montar();

    expect(botonPaginacion('Anterior')?.disabled).toBe(true);
    expect(botonPaginacion('Siguiente')?.disabled).toBe(false);
  });

  it('en la ultima pagina el boton Siguiente queda deshabilitado', async () => {
    auditoriasService.listar.mockReturnValue(
      of(pagina([enRevision], { paginaActual: 3, totalPaginas: 3, totalResultados: 60 }))
    );
    await montar();

    expect(botonPaginacion('Siguiente')?.disabled).toBe(true);
  });

  /** Con una sola página el paginador sobra y solo agrega ruido. */
  it('con una sola pagina no se dibuja el paginador', async () => {
    await montar();

    expect(raiz().querySelector('.ch-listado-auditorias__paginador')).toBeNull();
  });

  /** Un vacío por filtro no es lo mismo que no tener auditorías: el mensaje tiene que distinguirlo. */
  it('si el filtro no deja resultados lo dice y ofrece quitarlo', async () => {
    await montar();
    auditoriasService.listar.mockReturnValue(of(pagina([])));
    await seleccionarEstado(2);

    const vacio = raiz().querySelector('.ch-listado-auditorias__vacio');
    expect(vacio?.textContent).toContain('Ninguna solicitud coincide');
    expect(vacio?.textContent).not.toContain('Aún no tienes solicitudes');
  });

  it('el boton "Quitar filtros" del estado vacio vuelve a pedir el listado completo', async () => {
    await montar();
    auditoriasService.listar.mockReturnValue(of(pagina([])));
    await seleccionarEstado(2);

    Array.from(raiz().querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'Quitar filtros')
      ?.click();
    await estabilizar();

    expect(auditoriasService.listar).toHaveBeenLastCalledWith({ filtroEstado: [], pagina: 1 });
  });

  /**
   * Los dos pedidos quedan en vuelo a la vez; el primero en salir responde de último. Sin descartar
   * la respuesta obsoleta, la pantalla pintaría el filtro que el usuario ya abandonó.
   */
  /**
   * Deshabilitar los controles mientras carga achica la ventana pero no la cierra: entre el clic y
   * el ciclo de detección que aplica el `disabled` todavía cabe un segundo pedido. Por eso el
   * descarte se prueba llamando a la paginación directamente, que es lo que la UI no deja repetir.
   */
  it('descarta la respuesta de un pedido que ya no es el vigente', async () => {
    const enVuelo: Subject<PaginaSolicitudesAuditoria>[] = [];
    auditoriasService.listar.mockImplementation(() => {
      const sujeto = new Subject<PaginaSolicitudesAuditoria>();
      enVuelo.push(sujeto);
      return sujeto;
    });

    fixture = TestBed.createComponent(ListadoAuditoriasPageComponent);
    await estabilizar();
    enVuelo[0].next(
      pagina([enRevision], { paginaActual: 1, totalPaginas: 3, totalResultados: 60 })
    );
    enVuelo[0].complete();
    await estabilizar();

    const componente = fixture.componentInstance as unknown as {
      irAPagina(numero: number): void;
    };
    componente.irAPagina(2);
    componente.irAPagina(3);
    await estabilizar();

    expect(enVuelo).toHaveLength(3);

    // El último responde primero; el viejo llega después y no debe pisar nada.
    enVuelo[2].next(
      pagina([enRevision], { paginaActual: 3, totalPaginas: 3, totalResultados: 60 })
    );
    enVuelo[2].complete();
    await estabilizar();

    enVuelo[1].next(
      pagina([esperandoRespuesta, enRevision], {
        paginaActual: 2,
        totalPaginas: 3,
        totalResultados: 60,
      })
    );
    enVuelo[1].complete();
    await estabilizar();

    expect(filas()).toHaveLength(1);
    expect(raiz().querySelector('.ch-listado-auditorias__pagina-actual')?.textContent).toContain(
      'Página 3 de 3'
    );
  });

  /** El tamaño de página lo fija el servidor; el rango tiene que salir de ahí y no de una constante. */
  it('calcula el rango con el tamanio de pagina que devuelve el backend', async () => {
    auditoriasService.listar.mockReturnValue(
      of(
        pagina([enRevision], {
          paginaActual: 2,
          totalPaginas: 3,
          totalResultados: 30,
          tamanioPagina: 10,
        })
      )
    );
    await montar();

    expect(raiz().querySelector('.ch-listado-auditorias__rango')?.textContent).toContain(
      '11–11 de 30'
    );
  });

  it('muestra el rango de resultados que se esta viendo', async () => {
    auditoriasService.listar.mockReturnValue(
      of(pagina([enRevision], { paginaActual: 2, totalPaginas: 3, totalResultados: 60 }))
    );
    await montar();

    expect(raiz().querySelector('.ch-listado-auditorias__rango')?.textContent).toContain(
      '26–26 de 60'
    );
  });

  it('un fallo de carga muestra el error y no una tabla vacia', async () => {
    auditoriasService.listar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    await montar();

    expect(raiz().querySelector('.ch-listado-auditorias__error')).not.toBeNull();
    expect(raiz().querySelector('.ch-listado-auditorias__tabla')).toBeNull();
  });
});
