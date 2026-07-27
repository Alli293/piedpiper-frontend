import {
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../../icon/icon.component';

export type MotivoRechazo = 'formato' | 'tamanio' | 'cantidad';

export interface ArchivoRechazado {
  nombre: string;
  motivo: MotivoRechazo;
  mensaje: string;
}

export const MENSAJE_FORMATO_INVALIDO = 'Solo se aceptan archivos en formato PDF.';

export function mensajeMaximoArchivos(maximo: number): string {
  return `Puedes adjuntar un máximo de ${maximo} documentos.`;
}

export function mensajeTamanioMaximo(maximoBytes: number): string {
  return `El archivo no puede superar ${formatearTamanio(maximoBytes)}.`;
}

export function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${redondear(kb)} KB`;
  return `${redondear(kb / 1024)} MB`;
}

function redondear(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace('.', ',');
}

interface ArchivoVista {
  archivo: File;
  clave: string;
  nombre: string;
  tamanio: string;
}

let nextId = 0;

@Component({
  selector: 'app-file-drop',
  imports: [IconComponent],
  templateUrl: './file-drop.component.html',
  styleUrl: './file-drop.component.scss',
  host: {
    class: 'ch-file-drop',
  },
})
export class FileDropComponent {
  label = input<string>();
  accept = input('application/pdf');
  maxArchivos = input(10);
  maxTamanioBytes = input(15 * 1024 * 1024);
  disabled = input(false);
  hint = input('');
  error = input('');

  archivos = model<File[]>([]);
  rechazado = output<ArchivoRechazado>();

  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campo');

  protected readonly zonaId = `ch-file-drop-${nextId++}`;
  protected readonly hintId = `${this.zonaId}-hint`;
  protected readonly errorId = `${this.zonaId}-error`;
  protected readonly listaId = `${this.zonaId}-lista`;

  protected readonly arrastrando = signal(false);
  private readonly errorInterno = signal('');

  protected readonly mensajeError = computed(() => this.error() || this.errorInterno());

  protected readonly textoAyuda = computed(
    () =>
      this.hint() ||
      `Hasta ${this.maxArchivos()} archivos PDF de ${formatearTamanio(this.maxTamanioBytes())} cada uno.`
  );

  protected readonly describedBy = computed(() =>
    this.mensajeError() ? `${this.hintId} ${this.errorId}` : this.hintId
  );

  protected readonly vistas = computed<ArchivoVista[]>(() =>
    this.archivos().map((archivo, indice) => ({
      archivo,
      clave: `${indice}-${archivo.name}-${archivo.size}`,
      nombre: archivo.name,
      tamanio: formatearTamanio(archivo.size),
    }))
  );

  protected abrirSelector(): void {
    if (this.disabled()) return;
    this.campo()?.nativeElement.click();
  }

  protected onSeleccion(event: Event): void {
    const campo = event.target as HTMLInputElement;
    this.agregar(Array.from(campo.files ?? []));
    campo.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.arrastrando.set(true);
  }

  protected onDragLeave(): void {
    this.arrastrando.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.arrastrando.set(false);
    if (this.disabled()) return;
    this.agregar(Array.from(event.dataTransfer?.files ?? []));
  }

  protected eliminar(indice: number): void {
    if (this.disabled()) return;
    this.errorInterno.set('');
    this.archivos.update((archivos) => archivos.filter((_, posicion) => posicion !== indice));
  }

  /** Acumula los archivos válidos sobre los ya seleccionados; nunca los reemplaza. */
  agregar(entrantes: File[]): void {
    if (entrantes.length === 0) return;

    const aceptados: File[] = [];
    let error = '';
    let disponibles = this.maxArchivos() - this.archivos().length;

    for (const archivo of entrantes) {
      if (!this.formatoValido(archivo)) {
        error = MENSAJE_FORMATO_INVALIDO;
        this.rechazado.emit({ nombre: archivo.name, motivo: 'formato', mensaje: error });
        continue;
      }
      if (archivo.size > this.maxTamanioBytes()) {
        error = mensajeTamanioMaximo(this.maxTamanioBytes());
        this.rechazado.emit({ nombre: archivo.name, motivo: 'tamanio', mensaje: error });
        continue;
      }
      if (disponibles <= 0) {
        error = mensajeMaximoArchivos(this.maxArchivos());
        this.rechazado.emit({ nombre: archivo.name, motivo: 'cantidad', mensaje: error });
        continue;
      }
      aceptados.push(archivo);
      disponibles -= 1;
    }

    this.errorInterno.set(error);
    if (aceptados.length > 0) {
      this.archivos.update((archivos) => [...archivos, ...aceptados]);
    }
  }

  private formatoValido(archivo: File): boolean {
    const accept = this.accept().trim();
    if (!accept) return true;

    const nombre = archivo.name.toLowerCase();
    return accept.split(',').some((patron) => {
      const esperado = patron.trim().toLowerCase();
      if (!esperado) return false;
      if (esperado.startsWith('.')) return nombre.endsWith(esperado);
      if (esperado.endsWith('/*')) return archivo.type.startsWith(esperado.slice(0, -1));
      if (esperado === 'application/pdf')
        return archivo.type === esperado || nombre.endsWith('.pdf');
      return archivo.type === esperado;
    });
  }
}
