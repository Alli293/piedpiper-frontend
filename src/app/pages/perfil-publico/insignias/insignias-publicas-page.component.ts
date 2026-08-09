import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { InsigniasEmpresaListComponent } from '../../../shared/components/insignias-empresa/insignias-empresa-list.component';
import { StateLayoutComponent } from '../../../shared/layouts/state-layout/state-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { descargarBlob } from '../../../shared/utils/download.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { InsigniaEmpresa, PerfilPublicoDTO } from '../perfil-publico.models';
import { PerfilPublicoService } from '../perfil-publico.service';
import { PerfilPublicoSeccionHeaderComponent } from '../shared/perfil-publico-seccion-header.component';

const MENSAJE_NO_ENCONTRADO = 'El perfil que buscas no existe o ya no está disponible.';
const MENSAJE_ERROR = 'No fue posible cargar las insignias en este momento.';
const MENSAJE_ERROR_DESCARGA = 'No fue posible descargar la insignia. Intenta nuevamente.';

@Component({
  selector: 'app-insignias-publicas-page',
  imports: [
    ButtonComponent,
    HeadingComponent,
    IconComponent,
    InsigniasEmpresaListComponent,
    PerfilPublicoSeccionHeaderComponent,
    StateLayoutComponent,
  ],
  templateUrl: './insignias-publicas-page.component.html',
  styleUrl: './insignias-publicas-page.component.scss',
})
export class InsigniasPublicasPageComponent implements OnInit {
  private readonly perfilPublicoService = inject(PerfilPublicoService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly slug = input.required<string>();

  protected readonly insignias = signal<InsigniaEmpresa[]>([]);
  protected readonly perfil = signal<PerfilPublicoDTO | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly noEncontrado = signal(false);
  protected readonly errorMensaje = signal(MENSAJE_ERROR);
  protected readonly noEncontradoMensaje = MENSAJE_NO_ENCONTRADO;

  private cargaRequestId = 0;

  ngOnInit(): void {
    void this.cargarInsignias();
    void this.cargarPerfil();
  }

  protected reintentar(): void {
    void this.cargarInsignias();
  }

  protected volver(): void {
    void this.router.navigate(['/empresa', this.slug(), 'reputacion']);
  }

  protected async descargarJsonLd(insignia: InsigniaEmpresa): Promise<void> {
    if (!insignia.urlVerificacionPublica) {
      this.toastService.error(MENSAJE_ERROR_DESCARGA);
      return;
    }

    try {
      const blob = await firstValueFrom(
        this.perfilPublicoService.descargarInsigniaJsonLd(insignia.urlVerificacionPublica)
      );
      descargarBlob(blob, this.nombreArchivo(insignia));
    } catch {
      this.toastService.error(MENSAJE_ERROR_DESCARGA);
    }
  }

  protected verificarOpenBadges(insignia: InsigniaEmpresa): void {
    if (insignia.codigoVerificacion) {
      void this.router.navigate(['/verificar', insignia.codigoVerificacion]);
    }
  }

  private nombreArchivo(insignia: InsigniaEmpresa): string {
    const base = `${insignia.nombre}-${insignia.nivelInsignia}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base || 'insignia'}.jsonld`;
  }

  private async cargarPerfil(): Promise<void> {
    try {
      const perfil = await firstValueFrom(this.perfilPublicoService.obtenerPerfil(this.slug()));
      this.perfil.set(perfil);
    } catch {
      // El encabezado degrada a su variante generica; no afecta el resto de la pagina.
    }
  }

  private async cargarInsignias(): Promise<void> {
    const requestId = ++this.cargaRequestId;
    this.cargando.set(true);
    this.error.set(false);
    this.noEncontrado.set(false);
    try {
      const insignias = await firstValueFrom(
        this.perfilPublicoService.listarInsignias(this.slug())
      );
      if (requestId !== this.cargaRequestId) return;
      this.insignias.set(insignias);
    } catch (err: unknown) {
      if (requestId !== this.cargaRequestId) return;
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.noEncontrado.set(true);
      } else {
        this.errorMensaje.set(apiErrorMessage(err) ?? MENSAJE_ERROR);
        this.error.set(true);
      }
    } finally {
      if (requestId === this.cargaRequestId) {
        this.cargando.set(false);
      }
    }
  }
}
