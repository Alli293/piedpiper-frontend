import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CertificacionPublica, PerfilPublicoDTO } from '../perfil-publico.models';
import { PerfilPublicoService } from '../perfil-publico.service';
import { CertificacionesPublicasPageComponent } from './certificaciones-publicas-page.component';

const PERFIL: PerfilPublicoDTO = {
  nombreEmpresa: 'Café del Valle S.A.',
  logoUrl: null,
  sectorIndustrial: 'AGRICULTURA',
  pais: 'Costa Rica',
  nivelEcologico: 'Oro',
  fechaActualizacionNivel: '2026-01-01T00:00:00Z',
  certificacionesVigentes: 3,
  insigniasActivas: 1,
};

const CERT_VIGENTE: CertificacionPublica = {
  id: 'cert-1',
  tipo: 'CARBONO_NEUTRAL',
  nombreCertificacion: 'Carbono Neutral',
  nombreAuditor: 'Ana Mora',
  fechaEmision: '2026-01-15T00:00:00Z',
  fechaVencimiento: '2027-01-15',
  estado: 'ACTIVA',
  codigoVerificacion: 'CH-2026-8F4A19KD',
};

const CERT_MAS_ANTIGUA: CertificacionPublica = {
  id: 'cert-2',
  tipo: 'INVENTARIO_GEI',
  nombreCertificacion: 'Inventario GEI',
  nombreAuditor: 'Carlos Ruiz',
  fechaEmision: '2025-06-01T00:00:00Z',
  fechaVencimiento: '2026-06-01',
  estado: 'ACTIVA',
  codigoVerificacion: 'CH-2025-9G5B29ME',
};

const CERT_ESTADO_DESCONOCIDO: CertificacionPublica = {
  id: 'cert-3',
  tipo: 'HUELLA_PRODUCTO',
  nombreCertificacion: 'Huella de Producto',
  nombreAuditor: 'María López',
  fechaEmision: '2024-01-01T00:00:00Z',
  fechaVencimiento: '2027-01-01',
  estado: 'SUSPENDIDA',
  codigoVerificacion: 'CH-2024-F2ASGWST',
};

describe('CertificacionesPublicasPageComponent', () => {
  let listarCertificaciones: ReturnType<typeof vi.fn>;
  let obtenerPerfil: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    listarCertificaciones = vi.fn().mockReturnValue(of([]));
    obtenerPerfil = vi.fn().mockReturnValue(of(PERFIL));

    await TestBed.configureTestingModule({
      imports: [CertificacionesPublicasPageComponent],
      providers: [
        provideRouter([]),
        { provide: PerfilPublicoService, useValue: { listarCertificaciones, obtenerPerfil } },
      ],
    }).compileComponents();
  });

  async function crearFixture(
    slug = 'cafe-del-valle'
  ): Promise<ComponentFixture<CertificacionesPublicasPageComponent>> {
    const fixture = TestBed.createComponent(CertificacionesPublicasPageComponent);
    fixture.componentRef.setInput('slug', slug);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function filas(root: HTMLElement): HTMLTableRowElement[] {
    return Array.from(root.querySelectorAll<HTMLTableRowElement>('tbody tr'));
  }

  it('renderiza una fila por certificacion, en el orden recibido', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE, CERT_MAS_ANTIGUA]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const nombres = filas(root).map(
      (fila) => fila.querySelector('.ch-certificaciones-publicas__cert-cell strong')?.textContent
    );
    expect(nombres).toEqual(['Carbono Neutral', 'Inventario GEI']);
  });

  it('mientras carga muestra el estado de carga con role="status"', () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const fixture = TestBed.createComponent(CertificacionesPublicasPageComponent);
    fixture.componentRef.setInput('slug', 'cafe-del-valle');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Cargando certificaciones...');
    expect(root.querySelector('[role="status"]')).not.toBeNull();
    expect(root.querySelector('table')).toBeNull();
  });

  it('ACTIVA se muestra como Vigente con variante success', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.className).toContain('ch-badge--success');
    expect(badge?.textContent?.trim()).toBe('Vigente');
  });

  it('VENCIDA se muestra como Vencida con variante warning', async () => {
    listarCertificaciones.mockReturnValue(of([{ ...CERT_VIGENTE, estado: 'VENCIDA' }]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.className).toContain('ch-badge--warning');
    expect(badge?.textContent?.trim()).toBe('Vencida');
  });

  it('REVOCADA se muestra como Revocada con variante danger', async () => {
    listarCertificaciones.mockReturnValue(of([{ ...CERT_VIGENTE, estado: 'REVOCADA' }]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.className).toContain('ch-badge--danger');
    expect(badge?.textContent?.trim()).toBe('Revocada');
  });

  it('un estado desconocido se muestra como No disponible con variante neutral', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_ESTADO_DESCONOCIDO]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.className).toContain('ch-badge--neutral');
    expect(badge?.textContent?.trim()).toBe('No disponible');
  });

  it('sin certificaciones muestra el estado vacio y no renderiza tabla ni barra de filtros', async () => {
    listarCertificaciones.mockReturnValue(of([]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Sin certificaciones registradas');
    expect(root.querySelector('table')).toBeNull();
    expect(root.querySelector('app-filter-chips')).toBeNull();
  });

  it('renderiza los cuatro chips de estado con sus contadores, incluyendo los que estan en cero', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE, CERT_MAS_ANTIGUA]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item'));
    expect(chips.map((chip) => chip.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Todas2',
      'Vigentes2',
      'Vencidas0',
      'Revocadas0',
    ]);
  });

  it('la celda de Auditor muestra el nombre real', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const auditorCell = root.querySelector('tbody .ch-certificaciones-publicas__auditor');
    expect(auditorCell?.textContent?.trim()).toBe(CERT_VIGENTE.nombreAuditor);
  });

  it('sin codigo de verificacion muestra "Sin código" y el boton Verificar queda deshabilitado', async () => {
    listarCertificaciones.mockReturnValue(
      of([{ ...CERT_VIGENTE, codigoVerificacion: null as unknown as string }])
    );
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('button.ch-certificaciones-publicas__codigo')).toBeNull();
    expect(root.textContent).toContain('Sin código');
    expect(root.querySelector('.ch-certificaciones-publicas__codigo-tooltip')).toBeNull();

    const verificarBtn = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      (boton) => boton.textContent?.includes('Verificar')
    );
    expect(verificarBtn?.disabled).toBe(true);
  });

  it('copia el codigo de verificacion al portapapeles y muestra el tooltip al hacer clic', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const boton: HTMLButtonElement | null = root.querySelector(
      '.ch-certificaciones-publicas__codigo'
    );
    expect(boton?.textContent).toContain(CERT_VIGENTE.codigoVerificacion);
    boton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith(CERT_VIGENTE.codigoVerificacion);
    expect(root.textContent).toContain('Código copiado');
  });

  it('el boton Volver navega a la reputacion de la empresa, no al historial del navegador', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const fixture = await crearFixture('cafe-del-valle');
    const root = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const botonVolver: HTMLButtonElement | null = root.querySelector('.ch-pp-header__volver');
    botonVolver?.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/empresa', 'cafe-del-valle', 'reputacion']);
  });

  it('muestra el nombre y logo de la empresa en el encabezado de seccion', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(obtenerPerfil).toHaveBeenCalledWith('cafe-del-valle');
    expect(root.querySelector('.ch-pp-header__crumb-link')?.textContent?.trim()).toBe(
      'Café del Valle S.A.'
    );
    expect(root.textContent).toContain('Certificaciones verificadas de Café del Valle S.A.');
  });

  it('filtrar por Vigentes reduce las filas mostradas', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE, CERT_ESTADO_DESCONOCIDO]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const chipVigentes = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item')
    ).find((chip) => chip.textContent?.includes('Vigentes'));
    chipVigentes?.click();
    fixture.detectChanges();

    expect(filas(root).length).toBe(1);
    expect(root.textContent).toContain('Carbono Neutral');
  });

  it('filtrar por un estado sin coincidencias muestra el mensaje de filtro vacio, no la tarjeta vacia', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const chipRevocadas = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item')
    ).find((chip) => chip.textContent?.includes('Revocadas'));
    chipRevocadas?.click();
    fixture.detectChanges();

    expect(root.querySelector('table')).toBeNull();
    expect(root.textContent).toContain('No hay certificaciones con este estado.');
    expect(root.textContent).not.toContain('Sin certificaciones registradas');

    const verTodas = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Ver todas')
    );
    verTodas?.click();
    fixture.detectChanges();

    expect(filas(root).length).toBe(1);
  });

  it('el total del encabezado no cambia al filtrar', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE, CERT_ESTADO_DESCONOCIDO]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const conteoTotal = root.querySelector('.ch-pp-header__conteo strong');
    expect(conteoTotal?.textContent?.trim()).toBe('2');

    const chipVigentes = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item')
    ).find((chip) => chip.textContent?.includes('Vigentes'));
    chipVigentes?.click();
    fixture.detectChanges();

    expect(conteoTotal?.textContent?.trim()).toBe('2');
  });

  it('un 404 muestra el estado de perfil no encontrado y no renderiza la tabla', async () => {
    listarCertificaciones.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'x' } }))
    );
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('El perfil que buscas no existe o ya no está disponible.');
    expect(root.querySelector('table')).toBeNull();
  });

  it('un error 500 muestra el mensaje inline y Reintentar vuelve a invocar el servicio', async () => {
    listarCertificaciones.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain(
      'No fue posible cargar las certificaciones en este momento.'
    );

    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const reintentar = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Reintentar')
    );
    reintentar?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listarCertificaciones).toHaveBeenCalledTimes(2);
    expect(filas(root).length).toBe(1);
  });

  it('el boton Verificar de cada fila navega a la verificacion publica de su propio codigo', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE, CERT_MAS_ANTIGUA]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const botones = filas(root).map((fila) =>
      Array.from(fila.querySelectorAll<HTMLButtonElement>('button')).find((boton) =>
        boton.textContent?.includes('Verificar')
      )
    );
    botones[0]?.click();
    botones[1]?.click();

    expect(navigateSpy).toHaveBeenNthCalledWith(1, ['/verificar', 'CH-2026-8F4A19KD']);
    expect(navigateSpy).toHaveBeenNthCalledWith(2, ['/verificar', 'CH-2025-9G5B29ME']);
  });

  it('las fechas se muestran en dd/MM/yyyy interpretadas en UTC', async () => {
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    const periodo = root.querySelector('.ch-certificaciones-publicas__periodo');
    expect(periodo?.textContent).toContain('15/01/2026');
    expect(periodo?.textContent).toContain('15/01/2027');
  });

  it('si falla la carga del perfil, la tabla de certificaciones igual se muestra', async () => {
    obtenerPerfil.mockReturnValue(throwError(() => new Error('falla red')));
    listarCertificaciones.mockReturnValue(of([CERT_VIGENTE]));
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(filas(root).length).toBe(1);
    expect(root.querySelector('.ch-pp-header__crumb-link')?.textContent?.trim()).toBe(
      'Perfil público'
    );
  });
});
