import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileDropComponent } from './file-drop.component';

describe('FileDropComponent', () => {
  let fixture: ComponentFixture<FileDropComponent>;

  function crearPdf(nombre: string, tamanioBytes = 1024): File {
    const archivo = new File(['%PDF-1.7 contenido'], nombre, { type: 'application/pdf' });
    Object.defineProperty(archivo, 'size', { value: tamanioBytes });
    return archivo;
  }

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function soltar(...archivos: File[]): Promise<void> {
    const zona = raiz().querySelector<HTMLButtonElement>('.ch-file-drop__zone');
    const evento = new Event('drop') as Event & { dataTransfer: { files: File[] } };
    Object.defineProperty(evento, 'dataTransfer', { value: { files: archivos } });
    zona?.dispatchEvent(evento);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function nombresListados(): string[] {
    return Array.from(raiz().querySelectorAll('.ch-file-drop__item-name')).map(
      (nodo) => nodo.textContent?.trim() ?? ''
    );
  }

  function botonEliminar(nombre: string): HTMLButtonElement | null {
    return raiz().querySelector<HTMLButtonElement>(`button[aria-label="Eliminar ${nombre}"]`);
  }

  function mensajeError(): string {
    return raiz().querySelector('.ch-file-drop__error')?.textContent?.trim() ?? '';
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FileDropComponent] }).compileComponents();
    fixture = TestBed.createComponent(FileDropComponent);
    fixture.detectChanges();
  });

  it('acumula los archivos agregados en vez de reemplazar los anteriores', async () => {
    await soltar(crearPdf('primero.pdf'));
    await soltar(crearPdf('segundo.pdf'), crearPdf('tercero.pdf'));

    expect(nombresListados()).toEqual(['primero.pdf', 'segundo.pdf', 'tercero.pdf']);
    expect(fixture.componentInstance.archivos().length).toBe(3);
  });

  it('elimina un archivo individual sin afectar a los demas', async () => {
    await soltar(crearPdf('primero.pdf'), crearPdf('segundo.pdf'));

    botonEliminar('primero.pdf')?.click();
    fixture.detectChanges();

    expect(nombresListados()).toEqual(['segundo.pdf']);
  });

  it('respeta el maximo de archivos y avisa al usuario', async () => {
    fixture.componentRef.setInput('maxArchivos', 2);
    fixture.detectChanges();

    await soltar(crearPdf('a.pdf'), crearPdf('b.pdf'), crearPdf('c.pdf'));

    expect(nombresListados()).toEqual(['a.pdf', 'b.pdf']);
    expect(mensajeError()).toBe('Puedes adjuntar un máximo de 2 documentos.');
  });

  it('rechaza archivos que no son PDF', async () => {
    const texto = new File(['x'], 'notas.txt', { type: 'text/plain' });

    await soltar(texto);

    expect(nombresListados()).toEqual([]);
    expect(mensajeError()).toBe('Solo se aceptan archivos en formato PDF.');
  });

  it('rechaza un archivo con extension .pdf que no lleva la firma %PDF-', async () => {
    const falso = new File(['solo texto plano'], 'renombrado.pdf', { type: 'application/pdf' });

    await soltar(falso);

    expect(nombresListados()).toEqual([]);
    expect(mensajeError()).toBe('Solo se aceptan archivos en formato PDF.');
  });

  it('rechaza un archivo con firma valida pero content-type que no es PDF', async () => {
    const disfrazado = new File(['%PDF-1.7 contenido'], 'documento.pdf', { type: 'text/plain' });

    await soltar(disfrazado);

    expect(nombresListados()).toEqual([]);
    expect(mensajeError()).toBe('Solo se aceptan archivos en formato PDF.');
  });

  it('rechaza archivos que superan el tamanio maximo', async () => {
    await soltar(crearPdf('grande.pdf', 16 * 1024 * 1024));

    expect(nombresListados()).toEqual([]);
    expect(mensajeError()).toBe('El archivo no puede superar 15 MB.');
  });

  it('conserva el primer motivo cuando se rechazan archivos por causas distintas', async () => {
    const texto = new File(['x'], 'notas.txt', { type: 'text/plain' });

    await soltar(texto, crearPdf('grande.pdf', 16 * 1024 * 1024));

    expect(mensajeError()).toBe('Solo se aceptan archivos en formato PDF.');
  });

  it('muestra el tamanio formateado de cada archivo', async () => {
    await soltar(crearPdf('reporte.pdf', 2 * 1024 * 1024));

    expect(raiz().querySelector('.ch-file-drop__item-size')?.textContent?.trim()).toBe('2 MB');
  });

  it('mueve el foco al siguiente archivo al eliminar uno de la lista', async () => {
    await soltar(crearPdf('primero.pdf'), crearPdf('segundo.pdf'));

    botonEliminar('primero.pdf')?.click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(botonEliminar('segundo.pdf'));
  });

  it('devuelve el foco a la zona de carga cuando se elimina el ultimo archivo', async () => {
    await soltar(crearPdf('unico.pdf'));

    botonEliminar('unico.pdf')?.click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(raiz().querySelector('.ch-file-drop__zone'));
  });

  it('anuncia los cambios de la lista con una region aria-live', () => {
    expect(raiz().querySelector('.ch-file-drop__list')?.getAttribute('aria-live')).toBe('polite');
  });
});
