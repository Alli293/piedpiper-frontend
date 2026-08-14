import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SidebarBottomItem, SidebarComponent, SidebarMenuItem } from './sidebar.component';

const MENU_ITEMS: SidebarMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: true },
  { id: 'emisiones', label: 'Mis Emisiones', icon: 'emisiones', active: false, disabled: true },
];

const BOTTOM_ITEMS: SidebarBottomItem[] = [
  { id: 'settings', label: 'Configuración', icon: 'config' },
  { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
];

@Component({
  imports: [SidebarComponent],
  template: `
    <app-sidebar
      [menuItems]="menuItems"
      [bottomItems]="bottomItems"
      [companyName]="companyName"
      [companyRole]="companyRole"
      [companyInitials]="companyInitials"
      (menuItemClicked)="clicked.push($event)"
    />
  `,
})
class HostComponent {
  menuItems = MENU_ITEMS;
  bottomItems = BOTTOM_ITEMS;
  companyName = 'Acme S.A.';
  companyRole = 'Administrador';
  companyInitials = 'AC';
  clicked: string[] = [];
}

describe('SidebarComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza el nombre, rol e iniciales de la empresa', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-sidebar__company-name')?.textContent).toBe('Acme S.A.');
    expect(root.querySelector('.ch-sidebar__company-role')?.textContent).toBe('Administrador');
    expect(root.querySelector('.ch-avatar__initials')?.textContent).toBe('AC');
  });

  it('renderiza un botón por cada item de menú y de la sección inferior', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const etiquetas = Array.from(root.querySelectorAll<HTMLElement>('.ch-sidebar__item-label')).map(
      (el) => el.textContent
    );
    expect(etiquetas).toEqual(['Dashboard', 'Mis Emisiones', 'Configuración', 'Cerrar sesión']);
  });

  it('marca como activo el item cuyo active es true', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const botones = root.querySelectorAll<HTMLButtonElement>('.ch-sidebar__item');
    expect(botones[0].getAttribute('aria-current')).toBe('page');
    expect(botones[1].getAttribute('aria-current')).toBeNull();
  });

  it('emite menuItemClicked al hacer click en un item habilitado', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelectorAll<HTMLButtonElement>('.ch-sidebar__item')[0].click();

    expect(fixture.componentInstance.clicked).toEqual(['dashboard']);
  });

  it('no emite menuItemClicked al hacer click en un item deshabilitado', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const deshabilitado = root.querySelectorAll<HTMLButtonElement>('.ch-sidebar__item')[1];
    expect(deshabilitado.getAttribute('aria-disabled')).toBe('true');

    deshabilitado.click();

    expect(fixture.componentInstance.clicked).toEqual([]);
  });

  it('emite menuItemClicked al hacer click en un item de la sección inferior', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelectorAll<HTMLButtonElement>('.ch-sidebar__item')[3].click();

    expect(fixture.componentInstance.clicked).toEqual(['logout']);
  });
});
