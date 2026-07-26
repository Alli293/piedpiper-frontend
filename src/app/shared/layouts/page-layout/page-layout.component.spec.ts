import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HeaderConfig, PageLayoutComponent, SidebarConfig } from './page-layout.component';

const SIDEBAR_CONFIG: SidebarConfig = {
  menuItems: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: true }],
  bottomItems: [{ id: 'settings', label: 'Configuración', icon: 'config' }],
  companyName: 'Acme S.A.',
  companyRole: 'Administrador',
  companyInitials: 'AC',
};

const HEADER_CONFIG: HeaderConfig = {
  sectionLabel: 'EMPRESA',
  pageTitle: 'Dashboard',
  showNotificationDot: false,
};

@Component({
  imports: [PageLayoutComponent],
  template: `
    <app-page-layout
      [sidebarConfig]="sidebarConfig"
      [headerConfig]="headerConfig"
      (menuItemClicked)="menuClicked = $event"
      (notificationClicked)="notificaciones = notificaciones + 1"
      (profileClicked)="perfiles = perfiles + 1"
      (backClicked)="atras = atras + 1"
    >
      <span pageHeaderActions>Acción de encabezado</span>
      <p>Contenido de la página</p>
    </app-page-layout>
  `,
})
class HostComponent {
  sidebarConfig = SIDEBAR_CONFIG;
  headerConfig = HEADER_CONFIG;
  menuClicked: string | null = null;
  notificaciones = 0;
  perfiles = 0;
  atras = 0;
}

describe('PageLayoutComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('pasa la configuración del sidebar y del header a sus componentes', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-sidebar__company-name')?.textContent).toBe('Acme S.A.');
    expect(root.querySelector('.ch-header__title')?.textContent).toBe('Dashboard');
  });

  it('proyecta las acciones del encabezado y el contenido principal', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-header__right')?.textContent).toContain('Acción de encabezado');
    expect(root.querySelector('.ch-page-layout__content')?.textContent).toContain(
      'Contenido de la página'
    );
  });

  it('reenvía menuItemClicked desde el sidebar', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.ch-sidebar__item')!.click();

    expect(fixture.componentInstance.menuClicked).toBe('dashboard');
  });

  it('reenvía los eventos del header (notificación, perfil, volver)', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.ch-header__icon-button')!.click();
    root.querySelector<HTMLButtonElement>('.ch-header__profile-button')!.click();

    expect(fixture.componentInstance.notificaciones).toBe(1);
    expect(fixture.componentInstance.perfiles).toBe(1);
  });
});
