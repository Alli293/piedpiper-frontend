import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BienvenidaPageComponent } from './bienvenida-page.component';

describe('BienvenidaPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BienvenidaPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra las tres opciones de rol', () => {
    const fixture = TestBed.createComponent(BienvenidaPageComponent);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.bienvenida__role');
    expect(cards.length).toBe(3);

    const titulos = Array.from(
      fixture.nativeElement.querySelectorAll('.bienvenida__role-title')
    ).map((e) => (e as HTMLElement).textContent?.trim());
    expect(titulos).toEqual(['Empresa', 'Auditor certificado', 'Viajero sostenible']);
  });

  it('cada opcion enlaza a su ruta de registro', () => {
    const fixture = TestBed.createComponent(BienvenidaPageComponent);
    fixture.detectChanges();

    const rutas = Array.from(fixture.nativeElement.querySelectorAll('.bienvenida__role')).map((a) =>
      (a as HTMLElement).getAttribute('href')
    );
    expect(rutas).toEqual(['/registro/empresa', '/registro/auditor', '/registro/viajero']);
  });
});
