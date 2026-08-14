import { Component, DestroyRef, OnInit, OnDestroy, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly destroyRef = inject(DestroyRef);

  readonly slug = input.required<string>();

  protected readonly estado = signal<'cargando' | 'exito' | 'error'>('cargando');
  protected readonly enlace = signal<EnlacePerfilDTO | null>(null);
  protected readonly copiado = signal<'ninguno' | 'enlace' | 'codigo'>('ninguno');
  protected readonly errorClipboard = signal<boolean>(false);
  protected readonly ogImagenError = signal<boolean>(false);

  private copiadoTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly metaTagsCreados: HTMLMetaElement[] = [];
  private readonly metaTagsPrevios = new Map<HTMLMetaElement, string>();

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

    if (!navigator.clipboard?.writeText) {
      this.errorClipboard.set(true);
      return;
    }

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

    if (!navigator.clipboard?.writeText) {
      this.errorClipboard.set(true);
      return;
    }

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

    this.perfilService
      .obtenerEnlaceComparticion(this.slug())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
      const existente = head.querySelector<HTMLMetaElement>(`meta[property="${tag.property}"]`);
      if (existente) {
        this.metaTagsPrevios.set(existente, existente.getAttribute('content') ?? '');
        existente.setAttribute('content', tag.content);
      } else {
        const meta = this.document.createElement('meta');
        meta.setAttribute('property', tag.property);
        meta.setAttribute('content', tag.content);
        head.appendChild(meta);
        this.metaTagsCreados.push(meta);
      }
    }
  }

  private limpiarMetaTags(): void {
    for (const meta of this.metaTagsCreados) {
      meta.remove();
    }
    this.metaTagsCreados.length = 0;

    for (const [meta, contenidoPrevio] of this.metaTagsPrevios) {
      meta.setAttribute('content', contenidoPrevio);
    }
    this.metaTagsPrevios.clear();
  }
}
