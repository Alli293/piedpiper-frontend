import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileDropComponent } from './file-drop.component';

describe('FileDropComponent', () => {
  let fixture: ComponentFixture<FileDropComponent>;

  function crearPdf(nombre: string, tamanioBytes = 1024): File {
    const archivo = new File(['contenido'], nombre, { type: 'application/pdf' });
    Object.defineProperty(archivo, 'size', { value: tamanioBytes });
    return archivo;
  }

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function soltar(...archivos: File[]): void {
    const zona = raiz().querySelector<HTMLButtonElement>('.ch-file-drop__zone');
    const evento = new Event('drop') as Event & { dataTransfer: { files: File[] } };
    Object.defineProperty(evento, 'dataTransfer', { value: { files: archivos } });
    zona?.dispatchEvent(evento);
    fixture.detectChanges();
  }

  function nombresListados(): string[] {
    return Array.from(raiz().querySelectorAll('.ch-file-drop__item-name')).map(
      (nodo) => nodo.textContent?.trim() ?? ''
    );
  }

  function mensajeError(): string {
    return raiz().querySelector('.ch-file-drop__error')?.textContent?.trim() ?? '';
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FileDropComponent] }).compileComponents();
    fixture = TestBed.createComponent(FileDropComponent);
    fixture.detectChanges();
  });

  it('acumula los archivos agregados en vez de reemplazar los anteriores', () => {
    soltar(crearPdf('primero.pdf'));
    soltar(crearPdf('segundo.pdf'), crearPdf('tercero.pdf'));

    expect(nombresListados()).toEqual(['primero.pdf', 'segundo.pdf', 'tercero.pdf']);
    expect(fixture.componentInstance.archivos().length).toBe(3);
  });

  it('elimina un archivo individual sin afectar a los demas', () => {
    soltar(crearPdf('primero.pdf'), crearPdf('segundo.pdf'));

    raiz().querySelector<HTMLButtonElement>('button[aria-label="Eliminar primero.pdf"]')?.click();
    fixture.detectChanges();

    expect(nombresListados()).toEqual(['segundo.pdf']);
  });

  it('respeta el maximo de archivos y avisa al usuario', () => {
    fixture.componentRef.setInput('maxArchivos', 2);
    fixture.detectChanges();

    soltar(crearPdf('a.pdf'), crearPdf('b.pdf'), crearPdf('c.pdf'));

    expect(nombresListados()).toEqual(['a.pdf', 'b.pdf']);
    expect(mensajeError()).toBe('Puedes adjuntar un máximo de 2 documentos.');
  });

  it('rechaza archivos que no son PDF', () => {
    const texto = new File(['x'], 'notas.txt', { type: 'text/plain' });

    soltar(texto);

    expect(nombresListados()).toEqual([]);
    expect(mensajeError()).toBe('Solo se aceptan archivos en formato PDF.');
  });

  it('rechaza archivos que superan el tamanio maximo', () => {
    soltar(crearPdf('grande.pdf', 16 * 1024 * 1024));

    expect(nombresListados()).toEqual([]);
    expect(mensajeError()).toBe('El archivo no puede superar 15 MB.');
  });

  it('muestra todos los motivos cuando un lote se rechaza por razones distintas', () => {
    const noPdf = new File(['x'], 'notas.txt', { type: 'text/plain' });

    soltar(noPdf, crearPdf('grande.pdf', 16 * 1024 * 1024));

    expect(nombresListados()).toEqual([]);
    expect(mensajeError()).toContain('Solo se aceptan archivos en formato PDF.');
    expect(mensajeError()).toContain('El archivo no puede superar 15 MB.');
  });

  it('no repite el mismo motivo aunque varios archivos fallen igual', () => {
    soltar(crearPdf('a.pdf', 16 * 1024 * 1024), crearPdf('b.pdf', 20 * 1024 * 1024));

    expect(mensajeError()).toBe('El archivo no puede superar 15 MB.');
  });

  it('la clave de seguimiento no depende de la posicion en la lista', () => {
    soltar(crearPdf('primero.pdf'), crearPdf('segundo.pdf'), crearPdf('tercero.pdf'));
    const clavesAntes = fixture.componentInstance['vistas']().map((vista) => vista.clave);

    raiz().querySelector<HTMLButtonElement>('button[aria-label="Eliminar primero.pdf"]')?.click();
    fixture.detectChanges();

    const clavesDespues = fixture.componentInstance['vistas']().map((vista) => vista.clave);
    expect(clavesDespues).toEqual(clavesAntes.slice(1));
  });

  it('muestra el tamanio formateado de cada archivo', () => {
    soltar(crearPdf('reporte.pdf', 2 * 1024 * 1024));

    expect(raiz().querySelector('.ch-file-drop__item-size')?.textContent?.trim()).toBe('2 MB');
  });
});
