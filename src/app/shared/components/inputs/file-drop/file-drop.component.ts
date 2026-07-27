import {
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { IconComponent } from '../../icon/icon.component';

export type MotivoRechazo = 'formato' | 'tamanio' | 'cantidad';

export interface ArchivoRechazado {
  nombre: string;
  motivo: MotivoRechazo;
  mensaje: string;
}

export const MENSAJE_FORMATO_INVALIDO = 'Solo se aceptan archivos en formato PDF.';

/** Firma `%PDF-`: el backend rechaza la solicitud completa si un documento no empieza con ella. */
const FIRMA_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];

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

interface Rechazo {
  motivo: MotivoRechazo;
  mensaje: string;
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
  private readonly zona = viewChild<ElementRef<HTMLButtonElement>>('zona');
  private readonly botonesEliminar = viewChildren<ElementRef<HTMLButtonElement>>('remover');

  protected readonly zonaId = `ch-file-drop-${nextId++}`;
  protected readonly hintId = `${this.zonaId}-hint`;
  protected readonly errorId = `${this.zonaId}-error`;
  protected readonly listaId = `${this.zonaId}-lista`;

  protected readonly arrastrando = signal(false);
  private readonly errorInterno = signal('');

  /** Clave estable por archivo: evita recrear la lista al eliminar uno del medio. */
  private readonly claves = new WeakMap<File, string>();
  private siguienteClave = 0;

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
    this.archivos().map((archivo) => ({
      archivo,
      clave: this.claveDe(archivo),
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
    const entrantes = Array.from(campo.files ?? []);
    campo.value = '';
    void this.agregar(entrantes);
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
    void this.agregar(Array.from(event.dataTransfer?.files ?? []));
  }

  protected eliminar(indice: number): void {
    if (this.disabled()) return;
    this.errorInterno.set('');
    this.moverFoco(indice);
    this.archivos.update((archivos) => archivos.filter((_, posicion) => posicion !== indice));
  }

  /**
   * El botón pulsado se destruye al eliminar el archivo y el foco caería en el body. Se mueve
   * antes de actualizar la lista: los botones vecinos sobreviven al re-render por su clave.
   */
  private moverFoco(indice: number): void {
    const botones = this.botonesEliminar();
    const destino = botones[indice + 1] ?? botones[indice - 1] ?? this.zona();
    destino?.nativeElement.focus();
  }

  /** Acumula los archivos válidos sobre los ya seleccionados; nunca los reemplaza. */
  async agregar(entrantes: File[]): Promise<void> {
    if (entrantes.length === 0) return;

    const aceptados: File[] = [];
    let error = '';
    let disponibles = this.maxArchivos() - this.archivos().length;

    for (const archivo of entrantes) {
      const rechazo = await this.rechazoDe(archivo, disponibles);
      if (rechazo !== null) {
        error = error || rechazo.mensaje;
        this.rechazado.emit({ nombre: archivo.name, ...rechazo });
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

  private async rechazoDe(archivo: File, disponibles: number): Promise<Rechazo | null> {
    if (!(await this.formatoValido(archivo))) {
      return { motivo: 'formato', mensaje: MENSAJE_FORMATO_INVALIDO };
    }
    if (archivo.size > this.maxTamanioBytes()) {
      return { motivo: 'tamanio', mensaje: mensajeTamanioMaximo(this.maxTamanioBytes()) };
    }
    if (disponibles <= 0) {
      return { motivo: 'cantidad', mensaje: mensajeMaximoArchivos(this.maxArchivos()) };
    }
    return null;
  }

  private async formatoValido(archivo: File): Promise<boolean> {
    const accept = this.accept().trim();
    if (!accept) return true;

    const nombre = archivo.name.toLowerCase();
    const coincide = accept.split(',').some((patron) => {
      const esperado = patron.trim().toLowerCase();
      if (!esperado) return false;
      if (esperado.startsWith('.')) return nombre.endsWith(esperado);
      if (esperado.endsWith('/*')) return archivo.type.startsWith(esperado.slice(0, -1));
      if (esperado === 'application/pdf') {
        return archivo.type === esperado && nombre.endsWith('.pdf');
      }
      return archivo.type === esperado;
    });

    return coincide && (await this.firmaValida(archivo, nombre));
  }

  /** Un .txt renombrado a .pdf llega con content-type válido: solo los bytes lo delatan. */
  private async firmaValida(archivo: File, nombre: string): Promise<boolean> {
    if (!nombre.endsWith('.pdf')) return true;
    const cabecera = new Uint8Array(await archivo.slice(0, FIRMA_PDF.length).arrayBuffer());
    return FIRMA_PDF.every((byte, indice) => cabecera[indice] === byte);
  }

  private claveDe(archivo: File): string {
    const existente = this.claves.get(archivo);
    if (existente !== undefined) return existente;

    const clave = `${this.zonaId}-${this.siguienteClave++}`;
    this.claves.set(archivo, clave);
    return clave;
  }
}
