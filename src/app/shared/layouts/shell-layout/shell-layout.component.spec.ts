import { TestBed } from '@angular/core/testing';
import { HeaderConfig } from '../page-layout/page-layout.component';
import { ShellLayoutComponent } from './shell-layout.component';
import { COMPANY_INITIALS, COMPANY_NAME, COMPANY_ROLE, SIDEBAR_NAV_ITEMS } from './sidebar-nav';

const HEADER_CONFIG: HeaderConfig = {
  sectionLabel: 'PANEL EMPRESARIAL',
  pageTitle: 'Dashboard',
  showNotificationDot: true,
  userInitials: COMPANY_INITIALS,
};

describe('ShellLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellLayoutComponent],
    }).compileComponents();
  });

  async function createFixture(activeId: (typeof SIDEBAR_NAV_ITEMS)[number]['id']) {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.componentRef.setInput('activeId', activeId);
    fixture.componentRef.setInput('headerConfig', HEADER_CONFIG);
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

  it('renderiza exactamente los ítems de SIDEBAR_NAV_ITEMS, en orden y sin inventar entradas', async () => {
    const fixture = await createFixture('dashboard');
    const root = fixture.nativeElement as HTMLElement;

    const items = root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item');
    expect(items.length).toBe(SIDEBAR_NAV_ITEMS.length);
    expect(items.length).toBe(3);
    expect(menuLabels(root)).toEqual(SIDEBAR_NAV_ITEMS.map((item) => item.label));
  });

  it('marca como activo el ítem indicado por activeId y solo ese', async () => {
    const fixture = await createFixture('emissions');
    const root = fixture.nativeElement as HTMLElement;

    const activos = root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item--active');
    expect(activos.length).toBe(1);

    const activo = activos[0];
    const etiquetaEsperada = SIDEBAR_NAV_ITEMS.find((item) => item.id === 'emissions')?.label;
    expect(activo.querySelector('.ch-sidebar__item-label')?.textContent?.trim()).toBe(
      etiquetaEsperada
    );
    expect(activo.getAttribute('aria-current')).toBe('page');
  });

  it('mueve el estado activo cuando cambia activeId', async () => {
    const fixture = await createFixture('dashboard');
    const root = fixture.nativeElement as HTMLElement;

    let activo = root.querySelector('.ch-sidebar__nav .ch-sidebar__item--active');
    expect(activo?.querySelector('.ch-sidebar__item-label')?.textContent?.trim()).toBe('Dashboard');

    fixture.componentRef.setInput('activeId', 'benchmark');
    fixture.detectChanges();

    const activos = root.querySelectorAll('.ch-sidebar__nav .ch-sidebar__item--active');
    expect(activos.length).toBe(1);
    activo = activos[0];
    const etiquetaBenchmark = SIDEBAR_NAV_ITEMS.find((item) => item.id === 'benchmark')?.label;
    expect(activo.querySelector('.ch-sidebar__item-label')?.textContent?.trim()).toBe(
      etiquetaBenchmark
    );
  });

  it('toma los datos de la empresa de las constantes compartidas', async () => {
    const fixture = await createFixture('dashboard');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-sidebar__company-name')?.textContent?.trim()).toBe(COMPANY_NAME);
    expect(root.querySelector('.ch-sidebar__company-role')?.textContent?.trim()).toBe(COMPANY_ROLE);
  });

  it('proyecta el contenido de la página dentro del layout', async () => {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.componentRef.setInput('activeId', 'dashboard');
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

  it('reemite menuItemClicked cuando se pulsa un ítem del menú', async () => {
    const fixture = await createFixture('dashboard');
    const root = fixture.nativeElement as HTMLElement;

    const emitido: string[] = [];
    fixture.componentInstance.menuItemClicked.subscribe((id) => emitido.push(id));

    const primerItem = root.querySelector<HTMLButtonElement>('.ch-sidebar__nav .ch-sidebar__item');
    primerItem?.click();

    expect(emitido).toEqual([SIDEBAR_NAV_ITEMS[0].id]);
  });
});
