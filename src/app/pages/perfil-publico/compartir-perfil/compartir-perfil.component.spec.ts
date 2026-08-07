import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { PerfilPublicoService } from '../perfil-publico.service';
import { EnlacePerfilDTO } from '../models/enlace-perfil.model';
import { CompartirPerfilComponent } from './compartir-perfil.component';

const ENLACE_COMPLETO: EnlacePerfilDTO = {
  urlCanonica: 'https://carbonhub.app/empresa/cafe-del-valle/reputacion',
  codigoIncrustar:
    '<a href="https://carbonhub.app/empresa/cafe-del-valle/reputacion" style="display:inline-block;padding:8px 12px;border:1px solid #ccc;border-radius:4px;text-decoration:none;color:#333;">Café del Valle S.A. — Perfil verificado en CarbonHub</a>',
  qrBase64:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB',
  ogTitulo: 'Café del Valle S.A. — Perfil de Reputación Ecológica | CarbonHub',
  ogDescripcion:
    'Nivel ecológico: ORO. Consulta el desempeño ambiental verificado de Café del Valle S.A.',
  ogImagen: 'https://carbonhub.app/images/cafe-del-valle-logo.png',
  ogUrl: 'https://carbonhub.app/empresa/cafe-del-valle/reputacion',
};

describe('CompartirPerfilComponent', () => {
  let perfilPublicoService: { obtenerEnlaceComparticion: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    perfilPublicoService = {
      obtenerEnlaceComparticion: vi.fn().mockReturnValue(of(ENLACE_COMPLETO)),
    };

    await TestBed.configureTestingModule({
      imports: [CompartirPerfilComponent],
      providers: [{ provide: PerfilPublicoService, useValue: perfilPublicoService }],
    }).compileComponents();
  });

  function crear(slug = 'cafe-del-valle'): ComponentFixture<CompartirPerfilComponent> {
    const fixture = TestBed.createComponent(CompartirPerfilComponent);
    fixture.componentRef.setInput('slug', slug);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza sección completa con URL, QR, sello y OG cuando la respuesta es exitosa', () => {
    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    // URL canónica visible
    expect(root.querySelector('.ch-compartir__url')?.textContent).toContain(
      'https://carbonhub.app/empresa/cafe-del-valle/reputacion'
    );

    // QR visible
    const qrImg = root.querySelector<HTMLImageElement>('.ch-compartir__qr-img');
    expect(qrImg).not.toBeNull();
    expect(qrImg!.src).toContain('data:image/png;base64,');

    // Sello incrustable visible
    expect(root.querySelector('.ch-compartir__sello-preview')).not.toBeNull();
    expect(root.querySelector('.ch-compartir__code-block')?.textContent).toContain(
      'Perfil verificado en CarbonHub'
    );

    // Previsualización OG
    expect(root.querySelector('.ch-compartir__og-title')?.textContent).toContain(
      'Café del Valle S.A. — Perfil de Reputación Ecológica | CarbonHub'
    );
    expect(root.querySelector('.ch-compartir__og-desc')?.textContent).toContain(
      'Nivel ecológico: ORO'
    );
    expect(root.querySelector<HTMLImageElement>('.ch-compartir__og-img')?.src).toContain(
      'cafe-del-valle-logo.png'
    );
  });

  it('muestra skeleton durante la carga', () => {
    const subject = new Subject<EnlacePerfilDTO>();
    perfilPublicoService.obtenerEnlaceComparticion.mockReturnValue(subject.asObservable());

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    // Debería mostrar skeleton
    expect(root.querySelector('.ch-compartir-loading')).not.toBeNull();
    expect(root.querySelectorAll('.ch-compartir-loading__skeleton').length).toBeGreaterThan(0);

    // No debería mostrar contenido exitoso
    expect(root.querySelector('.ch-compartir')).toBeNull();

    // Completar la carga
    subject.next(ENLACE_COMPLETO);
    subject.complete();
    fixture.detectChanges();

    // Skeleton desaparece
    expect(root.querySelector('.ch-compartir-loading')).toBeNull();
    expect(root.querySelector('.ch-compartir')).not.toBeNull();
  });

  it('oculta QR y muestra mensaje cuando qrBase64 es vacío', () => {
    perfilPublicoService.obtenerEnlaceComparticion.mockReturnValue(
      of({ ...ENLACE_COMPLETO, qrBase64: '' })
    );

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-compartir__qr-img')).toBeNull();
    expect(root.querySelector('.ch-compartir__qr-error')?.textContent).toContain(
      'No fue posible generar el código QR.'
    );
  });

  it('botón "Copiar enlace" invoca Clipboard API con URL correcta', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    const botonCopiar = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btn.textContent?.includes('Copiar enlace')
    );
    expect(botonCopiar).not.toBeNull();

    botonCopiar!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith(
      'https://carbonhub.app/empresa/cafe-del-valle/reputacion'
    );
  });

  it('confirmación "Enlace copiado" visible 3 segundos (fakeTimers)', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    const botonCopiar = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btn.textContent?.includes('Copiar enlace')
    );
    botonCopiar!.click();

    // Flush the promise
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    // Confirmación visible
    expect(root.textContent).toContain('Enlace copiado');

    // Avanzar 2999ms — todavía visible
    vi.advanceTimersByTime(2999);
    fixture.detectChanges();
    expect(root.textContent).toContain('Enlace copiado');

    // Avanzar 1ms más (total 3000ms) — desaparece
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Enlace copiado');

    vi.useRealTimers();
  });

  it('botón "Copiar código" copia HTML al clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    const botonCopiarCodigo = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      (btn) => btn.textContent?.includes('Copiar código')
    );
    expect(botonCopiarCodigo).not.toBeNull();

    botonCopiarCodigo!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith(ENLACE_COMPLETO.codigoIncrustar);
  });

  it('error HTTP muestra mensaje y botón reintentar', () => {
    perfilPublicoService.obtenerEnlaceComparticion.mockReturnValue(
      throwError(() => new Error('HTTP error'))
    );

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-compartir-error__msg')?.textContent).toContain(
      'No fue posible cargar las opciones de compartición'
    );

    const botonReintentar = root.querySelector<HTMLButtonElement>('.ch-compartir-error__retry');
    expect(botonReintentar).not.toBeNull();
    expect(botonReintentar!.textContent).toContain('Reintentar');

    // Al reintentar con respuesta exitosa, muestra contenido
    perfilPublicoService.obtenerEnlaceComparticion.mockReturnValue(of(ENLACE_COMPLETO));
    botonReintentar!.click();
    fixture.detectChanges();

    expect(root.querySelector('.ch-compartir-error')).toBeNull();
    expect(root.querySelector('.ch-compartir')).not.toBeNull();
  });

  it('clipboard fallback muestra mensaje alternativo cuando falla', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard no disponible'));
    Object.assign(navigator, { clipboard: { writeText } });

    const fixture = crear();
    const root = fixture.nativeElement as HTMLElement;

    const botonCopiar = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((btn) =>
      btn.textContent?.includes('Copiar enlace')
    );
    botonCopiar!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('.ch-compartir__clipboard-error')?.textContent).toContain(
      'No fue posible copiar el enlace. Selecciona la URL manualmente.'
    );
  });
});
