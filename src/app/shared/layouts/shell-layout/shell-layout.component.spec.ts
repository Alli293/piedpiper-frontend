import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ShellLayoutComponent } from './shell-layout.component';

describe('ShellLayoutComponent', () => {
  let fixture: ComponentFixture<ShellLayoutComponent>;
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  let authService: { cerrarSesion: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = {
      navigateByUrl: vi.fn(),
    };
    authService = {
      cerrarSesion: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ShellLayoutComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellLayoutComponent);
    fixture.componentRef.setInput('headerConfig', {
      sectionLabel: 'Panel',
      pageTitle: 'Dashboard',
      showNotificationDot: false,
      userInitials: 'AJ',
    });
    fixture.detectChanges();
  });

  it('cierra sesion antes de navegar al login', () => {
    (fixture.componentInstance as any).onMenuItem('logout');

    expect(authService.cerrarSesion).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('navega al placeholder de benchmark', () => {
    (fixture.componentInstance as any).onMenuItem('benchmark');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/benchmark');
  });
});
