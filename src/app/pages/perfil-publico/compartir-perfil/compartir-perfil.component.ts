import { Component, OnInit, OnDestroy, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { EnlacePerfilDTO } from '../models/enlace-perfil.model';
import { PerfilPublicoService } from '../perfil-publico.service';

@Component({
  selector: 'app-compartir-perfil',
  standalone: true,
  imports: [],
  templateUrl: './compartir-perfil.component.html',
  styleUrl: './compartir-perfil.component.scss',
})
export class CompartirPerfilComponent implements OnInit, OnDestroy {
  private readonly perfilService = inject(PerfilPublicoService);
  private readonly document = inject(DOCUMENT);

  readonly slug = input.required<string>();

  protected readonly estado = signal<'cargando' | 'exito' | 'error'>('cargando');
  protected readonly enlace = signal<EnlacePerfilDTO | null>(null);
  protected readonly copiado = signal<'ninguno' | 'enlace' | 'codigo'>('ninguno');
  protected readonly errorClipboard = signal<boolean>(false);
  protected readonly ogImagenError = signal<boolean>(false);

  private copiadoTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly metaTagsInsertados: HTMLMetaElement[] = [];

  ngOnInit(): void {
    this.cargarEnlace();
  }

  ngOnDestroy(): void {
    this.limpiarMetaTags();
    if (this.copiadoTimeout) {
      clearTimeout(this.copiadoTimeout);
    }
  }

  protected reintentar(): void {
    this.cargarEnlace();
  }

  protected copiarEnlace(): void {
    const url = this.enlace()?.urlCanonica;
    if (!url) return;

    this.errorClipboard.set(false);

    navigator.clipboard.writeText(url).then(
      () => {
        this.copiado.set('enlace');
        this.iniciarTimeoutCopiado();
      },
      () => {
        this.errorClipboard.set(true);
      }
    );
  }

  protected copiarCodigo(): void {
    const codigo = this.enlace()?.codigoIncrustar;
    if (!codigo) return;

    this.errorClipboard.set(false);

    navigator.clipboard.writeText(codigo).then(
      () => {
        this.copiado.set('codigo');
        this.iniciarTimeoutCopiado();
      },
      () => {
        this.errorClipboard.set(true);
      }
    );
  }

  protected descargarQr(): void {
    const qrBase64 = this.enlace()?.qrBase64;
    if (!qrBase64) return;

    const base64Data = qrBase64.replace(/^data:image\/png;base64,/, '');
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const url = URL.createObjectURL(blob);
    const a = this.document.createElement('a');
    a.href = url;
    a.download = `qr-${this.slug()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private cargarEnlace(): void {
    this.estado.set('cargando');
    this.enlace.set(null);
    this.ogImagenError.set(false);
    this.limpiarMetaTags();

    this.perfilService.obtenerEnlaceComparticion(this.slug()).subscribe({
      next: (dto) => {
        this.enlace.set(dto);
        this.estado.set('exito');
        this.insertarMetaTags(dto);
      },
      error: () => {
        this.estado.set('error');
      },
    });
  }

  private iniciarTimeoutCopiado(): void {
    if (this.copiadoTimeout) {
      clearTimeout(this.copiadoTimeout);
    }
    this.copiadoTimeout = setTimeout(() => {
      this.copiado.set('ninguno');
      this.copiadoTimeout = null;
    }, 3000);
  }

  private insertarMetaTags(dto: EnlacePerfilDTO): void {
    this.limpiarMetaTags();

    const head = this.document.head;
    const tags: { property: string; content: string }[] = [
      { property: 'og:title', content: dto.ogTitulo },
      { property: 'og:description', content: dto.ogDescripcion },
      { property: 'og:image', content: dto.ogImagen },
      { property: 'og:url', content: dto.ogUrl },
      { property: 'og:type', content: 'website' },
    ];

    for (const tag of tags) {
      let meta = head.querySelector<HTMLMetaElement>(`meta[property="${tag.property}"]`);
      if (meta) {
        meta.setAttribute('content', tag.content);
      } else {
        meta = this.document.createElement('meta');
        meta.setAttribute('property', tag.property);
        meta.setAttribute('content', tag.content);
        head.appendChild(meta);
      }
      this.metaTagsInsertados.push(meta);
    }
  }

  private limpiarMetaTags(): void {
    for (const meta of this.metaTagsInsertados) {
      meta.remove();
    }
    this.metaTagsInsertados.length = 0;
  }
}
