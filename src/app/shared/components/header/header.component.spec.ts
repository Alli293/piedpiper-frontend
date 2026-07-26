import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';

@Component({
  imports: [HeaderComponent],
  template: `
    <app-header
      [sectionLabel]="sectionLabel"
      [pageTitle]="pageTitle"
      [showNotificationDot]="showNotificationDot"
      [userInitials]="userInitials"
      [showBackButton]="showBackButton"
      (notificationClicked)="notificaciones = notificaciones + 1"
      (profileClicked)="perfiles = perfiles + 1"
      (backClicked)="atras = atras + 1"
    />
  `,
})
class HostComponent {
  sectionLabel = 'EMPRESA';
  pageTitle = 'Dashboard';
  showNotificationDot = false;
  userInitials = 'AC';
  showBackButton = false;
  notificaciones = 0;
  perfiles = 0;
  atras = 0;
}

describe('HeaderComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza sectionLabel() y pageTitle()', () => {
    const fixture = createFixture({ sectionLabel: 'EMPRESA', pageTitle: 'Dashboard' });
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-header__eyebrow')?.textContent).toBe('EMPRESA');
    expect(root.querySelector('.ch-header__title')?.textContent).toBe('Dashboard');
  });

  it('no muestra el botón volver por defecto', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('.ch-header__back-button')).toBeNull();
  });

  it('muestra el botón volver y emite backClicked al hacer click', () => {
    const fixture = createFixture({ showBackButton: true });
    const root = fixture.nativeElement as HTMLElement;

    const boton: HTMLButtonElement = root.querySelector('.ch-header__back-button')!;
    expect(boton).toBeTruthy();
    boton.click();

    expect(fixture.componentInstance.atras).toBe(1);
  });

  it('emite notificationClicked al hacer click en el botón de notificaciones', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.ch-header__icon-button')!.click();

    expect(fixture.componentInstance.notificaciones).toBe(1);
  });

  it('no muestra el punto de notificación por defecto', () => {
    const fixture = createFixture({ showNotificationDot: false });

    expect(fixture.nativeElement.querySelector('.ch-header__notification-dot')).toBeNull();
  });

  it('muestra el punto de notificación cuando showNotificationDot() es true', () => {
    const fixture = createFixture({ showNotificationDot: true });

    expect(fixture.nativeElement.querySelector('.ch-header__notification-dot')).toBeTruthy();
  });

  it('emite profileClicked al hacer click en el botón de perfil', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.ch-header__profile-button')!.click();

    expect(fixture.componentInstance.perfiles).toBe(1);
  });

  it('renderiza las iniciales del usuario en el avatar de perfil', () => {
    const fixture = createFixture({ userInitials: 'AC' });

    expect(fixture.nativeElement.querySelector('.ch-avatar__initials')?.textContent).toBe('AC');
  });
});
