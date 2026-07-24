import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { HeaderConfig } from '../page-layout/page-layout.component';
import { ShellLayoutComponent } from './shell-layout.component';

const HEADER_CONFIG: HeaderConfig = {
  sectionLabel: 'PANEL EMPRESARIAL',
  pageTitle: 'Dashboard',
  showNotificationDot: true,
  userInitials: 'MR',
};

describe('ShellLayoutComponent', () => {
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let cerrarSesion: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    navigateByUrl = vi.fn().mockResolvedValue(true);
    cerrarSesion = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ShellLayoutComponent],
      providers: [
        { provide: Router, useValue: { navigateByUrl } },
        { provide: AuthService, useValue: { cerrarSesion } },
      ],
    }).compileComponents();
  });

  async function createFixture(
    inputs: {
      activeId?: string;
      companyRole?: string;
      settingsLabel?: string;
      backRoute?: string;
    } = {}
  ): Promise<ComponentFixture<ShellLayoutComponent>> {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.componentRef.setInput('headerConfig', HEADER_CONFIG);
    if (inputs.activeId !== undefined) fixture.componentRef.setInput('activeId', inputs.activeId);
    if (inputs.companyRole !== undefined)
      fixture.componentRef.setInput('companyRole', inputs.companyRole);
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

  it('renderiza los 3 ítems del menú de sidebar-nav, en orden', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });
    const root = fixture.nativeElement as HTMLElement;

    const items = root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item');
    expect(items.length).toBe(3);
    expect(menuLabels(root)).toEqual(['Dashboard', 'Mis Emisiones', 'Madurez ambiental']);
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
    expect(root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item').length).toBe(3);
  });

  it('usa el companyRole recibido por input', async () => {
    const fixture = await createFixture({ activeId: 'dashboard', companyRole: 'Auditor externo' });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-sidebar__company-role')?.textContent?.trim()).toBe(
      'Auditor externo'
    );
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
    const fixture = await createFixture({ activeId: 'dashboard', backRoute: '/emisiones' });
    const emitido: void[] = [];
    fixture.componentInstance.backClicked.subscribe(() => emitido.push(undefined));

    fixture.componentInstance['onBackClicked']();

    expect(navigateByUrl).toHaveBeenCalledWith('/emisiones');
    expect(emitido.length).toBe(0);
  });

  it('sin backRoute, el back emite backClicked y no navega', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });
    const emitido: void[] = [];
    fixture.componentInstance.backClicked.subscribe(() => emitido.push(undefined));

    fixture.componentInstance['onBackClicked']();

    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(emitido.length).toBe(1);
  });

  it('cierra sesion antes de navegar al login', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('logout');

    expect(cerrarSesion).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('navega al placeholder de benchmark', async () => {
    const fixture = await createFixture({ activeId: 'dashboard' });

    (fixture.componentInstance as any).onMenuItem('benchmark');

    expect(navigateByUrl).toHaveBeenCalledWith('/benchmark');
  });
});
