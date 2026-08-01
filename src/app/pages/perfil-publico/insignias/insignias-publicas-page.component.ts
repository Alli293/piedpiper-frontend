import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { InsigniasEmpresaListComponent } from '../../../shared/components/insignias-empresa/insignias-empresa-list.component';
import { StateHeaderComponent } from '../../../shared/components/state-header/state-header.component';
import { StateLayoutComponent } from '../../../shared/layouts/state-layout/state-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { descargarBlob } from '../../../shared/utils/download.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { InsigniaEmpresa } from '../perfil-publico.models';
import { PerfilPublicoService } from '../perfil-publico.service';

const MENSAJE_NO_ENCONTRADO = 'El perfil que buscas no existe o ya no está disponible.';
const MENSAJE_ERROR = 'No fue posible cargar las insignias en este momento.';
const MENSAJE_ERROR_DESCARGA = 'No fue posible descargar la insignia. Intenta nuevamente.';
const OPENBADGES_VALIDATOR_URL = 'https://certlister.com/ob3-validator/';

@Component({
  selector: 'app-insignias-publicas-page',
  imports: [
    ButtonComponent,
    HeadingComponent,
    IconComponent,
    InsigniasEmpresaListComponent,
    StateHeaderComponent,
    StateLayoutComponent,
  ],
  templateUrl: './insignias-publicas-page.component.html',
  styleUrl: './insignias-publicas-page.component.scss',
})
export class InsigniasPublicasPageComponent implements OnInit {
  private readonly perfilPublicoService = inject(PerfilPublicoService);
  private readonly location = inject(Location);
  private readonly toastService = inject(ToastService);

  readonly slug = input.required<string>();

  protected readonly insignias = signal<InsigniaEmpresa[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly noEncontrado = signal(false);
  protected readonly errorMensaje = signal(MENSAJE_ERROR);
  protected readonly noEncontradoMensaje = MENSAJE_NO_ENCONTRADO;

  private cargaRequestId = 0;

  ngOnInit(): void {
    void this.cargarInsignias();
  }

  protected reintentar(): void {
    void this.cargarInsignias();
  }

  protected volver(): void {
    this.location.back();
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

  protected async descargarJwt(insignia: InsigniaEmpresa): Promise<void> {
    const urlJwt =
      insignia.urlVerificacionJwt ?? this.urlJwtDesdePublica(insignia.urlVerificacionPublica);
    if (!urlJwt) {
      this.toastService.error(MENSAJE_ERROR_DESCARGA);
      return;
    }

    try {
      const blob = await firstValueFrom(this.perfilPublicoService.descargarInsigniaJwt(urlJwt));
      descargarBlob(blob, this.nombreArchivoJwt(insignia));
    } catch {
      this.toastService.error(MENSAJE_ERROR_DESCARGA);
    }
  }

  protected compartirLinkedIn(insignia: InsigniaEmpresa): void {
    const urlLinkedIn = insignia.urlLinkedIn ?? this.urlLinkedIn(insignia);
    if (urlLinkedIn) {
      window.open(urlLinkedIn, '_blank', 'noopener');
    }
  }

  protected verificarOpenBadges(insignia: InsigniaEmpresa): void {
    const urlJwt =
      insignia.urlVerificacionJwt ?? this.urlJwtDesdePublica(insignia.urlVerificacionPublica);
    if (urlJwt) {
      window.open(
        `${OPENBADGES_VALIDATOR_URL}?url=${encodeURIComponent(urlJwt)}`,
        '_blank',
        'noopener'
      );
    }
  }

  private urlLinkedIn(insignia: InsigniaEmpresa): string | null {
    if (!insignia.urlVerificacionPublica) return null;

    const fecha = new Date(insignia.fechaObtencion);
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: `${insignia.nombre} - ${this.nivelLabel(insignia.nivelInsignia)}`,
      organizationName: insignia.emisor ?? 'CarbonHub',
      certUrl: insignia.urlVerificacionPublica,
    });

    if (!Number.isNaN(fecha.getTime())) {
      params.set('issueYear', String(fecha.getUTCFullYear()));
      params.set('issueMonth', String(fecha.getUTCMonth() + 1));
    }

    return `https://www.linkedin.com/profile/add?${params.toString()}`;
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

  private nombreArchivoJwt(insignia: InsigniaEmpresa): string {
    const base = `${insignia.nombre}-${insignia.nivelInsignia}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base || 'insignia'}.jwt`;
  }

  private nivelLabel(nivel: InsigniaEmpresa['nivelInsignia']): string {
    const labels: Record<InsigniaEmpresa['nivelInsignia'], string> = {
      bronce: 'Bronce',
      plata: 'Plata',
      oro: 'Oro',
    };
    return labels[nivel];
  }

  private urlJwtDesdePublica(urlPublica?: string): string | null {
    if (!urlPublica) return null;
    return urlPublica.endsWith('/verificacion')
      ? `${urlPublica}.jwt`
      : urlPublica.replace(/\/verificacion$/, '/verificacion.jwt');
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
