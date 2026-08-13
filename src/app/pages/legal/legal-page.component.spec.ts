import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { LegalPageComponent } from './legal-page.component';
import { CONTENIDOS_LEGALES, TipoDocumentoLegal } from './legal.content';

describe('LegalPageComponent', () => {
  let fixture: ComponentFixture<LegalPageComponent>;

  async function montar(documento: TipoDocumentoLegal | string | undefined) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LegalPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { data: of({ documento }), snapshot: { data: { documento } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalPageComponent);
    fixture.detectChanges();
  }

  function texto(): string {
    return fixture.nativeElement.textContent as string;
  }

  it('muestra los terminos de uso cuando la ruta lo pide', async () => {
    await montar('terminos');

    expect(texto()).toContain('Términos de uso');
    expect(texto()).toContain('Qué es CarbonHub');
  });

  it('muestra la politica de privacidad cuando la ruta lo pide', async () => {
    await montar('privacidad');

    expect(texto()).toContain('Política de privacidad');
    expect(texto()).toContain('Qué datos recolectamos');
  });

  /** El aviso de proyecto académico es lo primero que tiene que leer quien va a registrar datos. */
  it('los dos documentos advierten que es un proyecto academico', async () => {
    for (const documento of ['terminos', 'privacidad'] as TipoDocumentoLegal[]) {
      await montar(documento);
      expect(texto()).toContain('proyecto académico');
    }
  });

  it('renderiza todas las secciones del documento, no solo la primera', async () => {
    await montar('privacidad');

    for (const seccion of CONTENIDOS_LEGALES.privacidad.secciones) {
      expect(texto()).toContain(seccion.titulo);
    }
  });

  it('renderiza los items de las secciones que tienen lista', async () => {
    await montar('privacidad');

    const items = fixture.nativeElement.querySelectorAll('.ch-legal__lista li');
    expect(items.length).toBeGreaterThan(0);
  });

  it('cada documento enlaza al otro', async () => {
    await montar('terminos');
    let enlaces = [
      ...fixture.nativeElement.querySelectorAll('.ch-legal__pie a'),
    ] as HTMLAnchorElement[];
    expect(enlaces.some((a) => a.getAttribute('href') === '/privacidad')).toBe(true);

    await montar('privacidad');
    enlaces = [
      ...fixture.nativeElement.querySelectorAll('.ch-legal__pie a'),
    ] as HTMLAnchorElement[];
    expect(enlaces.some((a) => a.getAttribute('href') === '/terminos')).toBe(true);
  });

  it('muestra la fecha de ultima actualizacion', async () => {
    await montar('terminos');

    expect(texto()).toContain('Última actualización');
  });

  /**
   * Una ruta mal configurada (sin `documento`, o con uno que no está en el catálogo) buscaba un
   * contenido inexistente y la pantalla reventaba en el primer binding. Ahora cae a los términos y
   * avisa por consola a quien configuró la ruta.
   */
  it.each([undefined, 'cookies'])(
    'una ruta con documento=%s cae a los terminos en vez de reventar',
    async (documento) => {
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await montar(documento);

      expect(texto()).toContain('Términos de uso');
      expect(aviso).toHaveBeenCalled();
      aviso.mockRestore();
    }
  );
});
