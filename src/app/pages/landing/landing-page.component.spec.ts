import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el titulo principal del hero', () => {
    const fixture = crear();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'la huella de carbono de tu empresa'
    );
  });

  it('enlaza a login y a registro de empresa', () => {
    const fixture = crear();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelector('a[href="/login"]')).toBeTruthy();
    expect(html.querySelector('a[href="/registro/empresa"]')).toBeTruthy();
  });

  it('expone las secciones ancladas para la navegacion interna', () => {
    const fixture = crear();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelector('#para-quien')).toBeTruthy();
    expect(html.querySelector('#como-funciona')).toBeTruthy();
    expect(html.querySelector('#funcionalidades')).toBeTruthy();
  });

  it('al pulsar un enlace de la nav desplaza a la seccion correspondiente', () => {
    const fixture = crear();
    const comp = fixture.componentInstance as unknown as { irASeccion(id: string): void };
    const seccion = { scrollIntoView: vi.fn() } as unknown as HTMLElement;
    const getSpy = vi.spyOn(document, 'getElementById').mockReturnValue(seccion);

    comp.irASeccion('funcionalidades');

    expect(getSpy).toHaveBeenCalledWith('funcionalidades');
    expect(seccion.scrollIntoView).toHaveBeenCalled();
  });
});
