import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StateHeaderComponent } from './state-header.component';

describe('StateHeaderComponent', () => {
  function createFixture() {
    const fixture = TestBed.configureTestingModule({
      imports: [StateHeaderComponent],
      providers: [provideRouter([])],
    }).createComponent(StateHeaderComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('expone role banner en el host', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.getAttribute('role')).toBe('banner');
  });

  it('renderiza el logo, el enlace de ayuda y el de inicio de sesión', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-logo')).toBeTruthy();
    expect(root.textContent).toContain('Ayuda');
    const enlace: HTMLAnchorElement | null = root.querySelector('a[href="/login"]');
    expect(enlace?.textContent).toContain('Iniciar sesión');
  });
});
