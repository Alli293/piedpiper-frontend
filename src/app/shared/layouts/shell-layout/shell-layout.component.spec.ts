import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, tap, throwError } from 'rxjs';
import { ShellLayoutComponent } from './shell-layout.component';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionService } from '../../../core/auth-session.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { HeaderConfig } from '../page-layout/page-layout.component';
import { ToastService } from '../../services/toast.service';

const HEADER_CONFIG: HeaderConfig = {
  sectionLabel: 'PANEL EMPRESARIAL',
  pageTitle: 'Dashboard',
  showNotificationDot: true,
};

const PERFIL_ADMIN_EMPRESA = {
  nombre: 'Carolina Maria',
  apellidos: 'Vindas Rodríguez',
  rol: 'ADMINISTRADOR_EMPRESA',
  empresa: { nombreEmpresa: 'Café del Valle S.A.' },
} as PerfilInicial;

describe('ShellLayoutComponent', () => {
  let authServiceStub: { cerrarSesion: ReturnType<typeof vi.fn> };
  let authSessionStub: {
    getRole: ReturnType<typeof vi.fn>;
    getUserName: ReturnType<typeof vi.fn>;
    getUserInitials: ReturnType<typeof vi.fn>;
    getUserEmail: ReturnType<typeof vi.fn>;
    getUserId: ReturnType<typeof vi.fn>;
    isAdministradorEmpresa: ReturnType<typeof vi.fn>;
  };
  let sesionInactividadStub: { detener: ReturnType<typeof vi.fn> };
  let routerStub: { navigateByUrl: ReturnType<typeof vi.fn> };
  let perfilSignal: ReturnType<typeof signal<PerfilInicial | null>>;
  let perfilInicialStub: {
    perfil: ReturnType<typeof signal<PerfilInicial | null>>;
    obtener: ReturnType<typeof vi.fn>;
  };
  let toastServiceStub: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceStub = { cerrarSesion: vi.fn() };
    authSessionStub = {
      getRole: vi.fn().mockReturnValue('administrador_empresa'),
      getUserName: vi.fn().mockReturnValue('Test User'),
      getUserInitials: vi.fn().mockReturnValue('TU'),
      getUserEmail: vi.fn().mockReturnValue('test@test.com'),
      getUserId: vi.fn().mockReturnValue('123'),
      isAdministradorEmpresa: vi.fn().mockReturnValue(true),
    };
    sesionInactividadStub = { detener: vi.fn() };
    routerStub = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    perfilSignal = signal<PerfilInicial | null>(null);
    perfilInicialStub = {
      perfil: perfilSignal,
      obtener: vi
        .fn()
        .mockImplementation(() =>
          of(PERFIL_ADMIN_EMPRESA).pipe(tap((perfil) => perfilSignal.set(perfil)))
        ),
    };
    toastServiceStub = { error: vi.fn(), success: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ShellLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: SesionInactividadService, useValue: sesionInactividadStub },
        { provide: Router, useValue: routerStub },
        { provide: AuthSessionService, useValue: authSessionStub },
        { provide: PerfilInicialService, useValue: perfilInicialStub },
        { provide: ToastService, useValue: toastServiceStub },
      ],
    }).compileComponents();
  });

  async function createFixture(
    inputs: {
      activeId?: string;
      variant?: string;
      displayName?: string;
      companyRole?: string;
      displayInitials?: string;
      settingsLabel?: string;
      backRoute?: string;
    } = {}
  ) {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.componentRef.setInput('headerConfig', HEADER_CONFIG);
    if (inputs.activeId !== undefined) fixture.componentRef.setInput('activeId', inputs.activeId);
    if (inputs.variant !== undefined) fixture.componentRef.setInput('variant', inputs.variant);
    if (inputs.displayName !== undefined)
      fixture.componentRef.setInput('displayName', inputs.displayName);
    if (inputs.companyRole !== undefined)
      fixture.componentRef.setInput('companyRole', inputs.companyRole);
    if (inputs.displayInitials !== undefined)
      fixture.componentRef.setInput('displayInitials', inputs.displayInitials);
    if (inputs.settingsLabel !== undefined)
      fixture.componentRef.setInput('settingsLabel', inputs.settingsLabel);
    if (inputs.backRoute !== undefined)
      fixture.componentRef.setInput('backRoute', inputs.backRoute);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function menuLabels(root: HTMLElement): string[] {
    return Array.from(root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item-label')).map(
      (element) => element.textContent?.trim() ?? ''
    );
  }

  it('renderiza los 5 ítems del menú de sidebar-nav, en orden', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });
    const root = fixture.nativeElement as HTMLElement;

    const items = root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item');
    expect(items.length).toBe(6);
    expect(menuLabels(root)).toEqual([
      'Dashboard',
      'Mis Emisiones',
      'Certificaciones',
      'Madurez ambiental',
      'Insignias',
      'Colaboradores',
    ]);
  });

  it('oculta Colaboradores del sidebar para un usuario que no es administrador de empresa', async () => {
    authSessionStub.isAdministradorEmpresa.mockReturnValue(false);
    const fixture = await createFixture({ activeId: 'dashboard' });
    const root = fixture.nativeElement as HTMLElement;

    const items = root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item');
    expect(items.length).toBe(5);
    expect(menuLabels(root)).toEqual([
      'Dashboard',
      'Mis Emisiones',
      'Certificaciones',
      'Madurez ambiental',
      'Insignias',
    ]);
  });

  it('marca como activo el ítem indicado por activeId y solo ese', async () => {
    const fixture = await createFixture({ activeId: 'emissions' });
    const root = fixture.nativeElement as HTMLElement;

    const activos = root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item--active');
    expect(activos.length).toBe(1);
    expect(activos[0].querySelector('.ch-sidebar__item-label')?.textContent?.trim()).toBe(
      'Mis Emisiones'
    );
    expect(activos[0].getAttribute('aria-current')).toBe('page');
  });

  it('sin activeId no marca ningún ítem como activo (páginas fuera del menú, p. ej. configuración)', async () => {
    const fixture = await createFixture({});
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item--active').length).toBe(0);
    expect(root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item').length).toBe(6);
  });

  it('renderiza navegación EcoRuta cuando recibe la variante ecoruta', async () => {
    perfilInicialStub.obtener.mockImplementation(() =>
      of({
        nombre: 'Ana',
        apellidos: 'Ruta',
        rol: 'USUARIO_INDIVIDUAL',
        empresa: null,
      } as PerfilInicial).pipe(tap((perfil) => perfilSignal.set(perfil)))
    );
    const fixture = await createFixture({
      activeId: 'ecoruta-insignias',
      variant: 'ecoruta',
      displayName: 'EcoRuta',
      displayInitials: 'ER',
    });
    const root = fixture.nativeElement as HTMLElement;

    expect(menuLabels(root)).toEqual(['Planificar viaje', 'Mis itinerarios', 'Mis insignias']);
    expect(root.querySelector('.ch-sidebar__company-name')?.textContent?.trim()).toBe('EcoRuta');
    expect(root.querySelector('.ch-sidebar__company-role')?.textContent?.trim()).toBe(
      'Viajes · EcoRuta'
    );
    expect(root.querySelector('.ch-sidebar__item--active')?.textContent).toContain('Mis insignias');
  });

  it('sobrescribe la etiqueta de Configuración con settingsLabel', async () => {
    const fixture = await createFixture({ activeId: 'dashboard', settingsLabel: 'Ajustes' });
    const root = fixture.nativeElement as HTMLElement;

    const bottomLabels = Array.from(
      root.querySelectorAll('.ch-sidebar__bottom .ch-sidebar__item-label')
    ).map((element) => element.textContent?.trim());
    expect(bottomLabels).toContain('Ajustes');
    expect(bottomLabels).not.toContain('Configuración');
  });

  it('proyecta el contenido de la página dentro del layout', async () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.componentRef.setInput('headerConfig', HEADER_CONFIG);

    const projected = document.createElement('div');
    projected.className = 'contenido-proyectado';
    projected.textContent = 'contenido de prueba';
    fixture.nativeElement.appendChild(projected);

    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.contenido-proyectado')?.textContent).toBe('contenido de prueba');
  });

  it('con backRoute definido, el back navega a esa ruta sin emitir backClicked', async () => {
    const fixture = await createFixture({
      activeId: 'dashboard',
      backRoute: '/empresa/emisiones',
    });
    const emitido: void[] = [];
    fixture.componentInstance.backClicked.subscribe(() => emitido.push(undefined));

    fixture.componentInstance['onBackClicked']();

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/empresa/emisiones');
    expect(emitido.length).toBe(0);
  });

  it('sin backRoute, el back emite backClicked y no navega', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });
    const emitido: void[] = [];
    fixture.componentInstance.backClicked.subscribe(() => emitido.push(undefined));

    fixture.componentInstance['onBackClicked']();

    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
    expect(emitido.length).toBe(1);
  });

  it('cierra sesión, detiene la inactividad y navega al login', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('logout');

    expect(authServiceStub.cerrarSesion).toHaveBeenCalled();
    expect(sesionInactividadStub.detener).toHaveBeenCalled();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('navega a /configuracion sin cerrar sesión', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('settings');

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/configuracion');
    expect(authServiceStub.cerrarSesion).not.toHaveBeenCalled();
  });

  it('navega al panel de empresa al abrir Dashboard', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('dashboard');

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/empresa/panel');
  });

  it('navega al benchmark de empresa', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('benchmark');

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/empresa/benchmark');
  });

  it('navega a certificaciones de empresa', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('certificaciones');

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/empresa/certificaciones');
  });

  it('navega a las insignias de empresa', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('insignias-empresa');

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/empresa/insignias');
  });

  it('navega al listado de emisiones de empresa al abrir mis emisiones', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('emissions');

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/empresa/emisiones');
  });

  it('navega a las invitaciones de empresa al abrir colaboradores', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('colaboradores');

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/empresa/invitaciones');
  });

  it('navega a las rutas de EcoRuta desde el sidebar compartido', async () => {
    const fixture = await createFixture({ activeId: 'ecoruta-insignias', variant: 'ecoruta' });

    (fixture.componentInstance as any).onMenuItem('ecoruta-planificar');

    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/ecoruta/preferencias');
  });

  it('renderiza el nombre e iniciales de la empresa desde el perfil inicial', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-sidebar__company-name')?.textContent).toContain(
      'Café del Valle S.A.'
    );
    expect(root.querySelector('.ch-avatar__initials')?.textContent?.trim()).toBe('CA');
  });

  it('muestra iniciales de respaldo en el sidebar mientras el perfil no ha cargado', async () => {
    perfilInicialStub.obtener.mockReturnValue(of(null as unknown as PerfilInicial));
    const fixture = await createFixture({ activeId: 'dashboard' });
    const root = fixture.nativeElement as HTMLElement;

    const avatar = root.querySelector('.ch-sidebar__company-card .ch-avatar__initials');
    expect(avatar?.textContent?.trim()).toBe('US');
  });

  it('muestra un toast de error cuando falla la carga del perfil inicial', async () => {
    perfilInicialStub.obtener.mockReturnValue(throwError(() => new Error('falló')));

    await createFixture({ activeId: 'dashboard' });

    expect(toastServiceStub.error).toHaveBeenCalledWith(
      'No se pudo cargar tu perfil. Algunos datos podrían no mostrarse.'
    );
  });

  it('no muestra nombre de empresa cuando el usuario no pertenece a una empresa', async () => {
    perfilInicialStub.obtener.mockImplementation(() =>
      of({
        nombre: 'Carolina Maria',
        apellidos: 'Vindas Rodríguez',
        empresa: null,
      } as PerfilInicial).pipe(tap((perfil) => perfilSignal.set(perfil)))
    );
    const fixture = await createFixture({ activeId: 'dashboard' });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-sidebar__company-name')?.textContent?.trim()).toBe('');
  });

  it('calcula las iniciales del usuario con el primer nombre y el primer apellido, ignorando el segundo de cada uno', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });
    const root = fixture.nativeElement as HTMLElement;

    const headerInitials = root.querySelector('.ch-header__profile-button .ch-avatar__initials');
    expect(headerInitials?.textContent?.trim()).toBe('CV');
  });

  it('mapea el rol del perfil al texto de ch-sidebar__company-role', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-sidebar__company-role')?.textContent?.trim()).toBe(
      'Empresa · Admin'
    );
  });

  it('usa el companyRole recibido como respaldo mientras el perfil no ha cargado', async () => {
    perfilInicialStub.obtener.mockReturnValue(of(null as unknown as PerfilInicial));
    const fixture = await createFixture({
      activeId: 'dashboard',
      companyRole: 'Empresa · Admin',
    });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-sidebar__company-role')?.textContent?.trim()).toBe(
      'Empresa · Admin'
    );
  });

  it('no conserva las iniciales de una sesión previa mientras el nuevo perfil no ha cargado', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });
    const root = fixture.nativeElement as HTMLElement;
    expect(
      root.querySelector('.ch-header__profile-button .ch-avatar__initials')?.textContent?.trim()
    ).toBe('CV');

    perfilSignal.set(null);
    fixture.detectChanges();

    expect(
      root.querySelector('.ch-header__profile-button .ch-avatar__initials')?.textContent?.trim()
    ).toBe('');
  });
});
