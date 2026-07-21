import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  let auditoresService: { listar: ReturnType<typeof vi.fn> };
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

  beforeEach(async () => {
    auditoresService = { listar: vi.fn().mockReturnValue(of(paginaBase)) };
    toastService = { error: vi.fn(), toasts: signal([]) } as any;

    await TestBed.configureTestingModule({
      imports: [DirectorioAuditoresPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuditoresService, useValue: auditoresService },
        {
          provide: AuthSessionService,
          useValue: { getUserInitials: vi.fn().mockReturnValue('MR') },
        },
        { provide: AuthService, useValue: { cerrarSesion: vi.fn() } },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectorioAuditoresPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function comp() {
    return component as unknown as {
      resultado: { set(v: PaginaAuditores | null): void };
      cargando: { set(v: boolean): void };
      error: { set(v: boolean): void };
      onBuscar(v: string): void;
      onOrdenar(v: string): void;
      pagina(): number;
      avisoBusqueda(): string;
      tarjetas(): { iniciales: string; estrellas: boolean[]; ubicacion: string }[];
    };
  }

  function pintar() {
    comp().cargando.set(false);
    fixture.detectChanges();
  }

  it('consulta el directorio al iniciar con los criterios por defecto', async () => {
    await vi.waitFor(() =>
      expect(auditoresService.listar).toHaveBeenCalledWith({
        terminoBusqueda: '',
        pagina: 0,
        ordenamiento: 'CALIFICACION',
      })
    );
  });

  it('mientras carga muestra el estado de carga', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando auditores...');
  });

  it('pinta una tarjeta por cada auditor con nombre y auditorias', () => {
    comp().resultado.set(paginaBase);
    pintar();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelectorAll('.auditor-card')).toHaveLength(1);
    expect(html.textContent).toContain('Ana Mora');
    expect(html.textContent).toContain('42');
    expect(html.querySelector('.auditor-card')?.getAttribute('href')).toBe('/auditores/aud-1');
  });

  it('con lista vacia muestra el texto de sin resultados', () => {
    comp().resultado.set({ contenido: [], totalResultados: 0, paginaActual: 0, totalPaginas: 0 });
    pintar();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No se encontraron auditores que coincidan con tu búsqueda.'
    );
  });

  it('ante un error muestra el aviso con reintentar', () => {
    comp().error.set(true);
    pintar();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar el directorio de auditores'
    );
    expect(html.textContent).toContain('Reintentar');
  });

  it('un termino de un caracter muestra el aviso de minimo', () => {
    comp().onBuscar('a');

    expect(comp().avisoBusqueda()).toBe('Ingrese al menos 2 caracteres para buscar.');
    expect(comp().pagina()).toBe(0);
  });

  it('cambiar el orden reinicia a la primera pagina', () => {
    comp().resultado.set(paginaBase);
    pintar();
    (component as any).pagina.set(3);

    comp().onOrdenar('TIEMPO_RESPUESTA');

    expect(comp().pagina()).toBe(0);
  });

  it('deriva iniciales, estrellas y ubicacion en el view model de la tarjeta', () => {
    comp().resultado.set(paginaBase);

    const tarjeta = comp().tarjetas()[0];

    expect(tarjeta.iniciales).toBe('AM');
    expect(tarjeta.estrellas.filter(Boolean)).toHaveLength(5);
    expect(tarjeta.ubicacion).toBe('San José · 8 años exp.');
  });
});
