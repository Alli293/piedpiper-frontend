import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EmpresaService } from '../../../core/empresa/empresa.service';
import { InsigniaEmpresa } from '../../../core/empresa/empresa.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { InsigniasEmpresaListComponent } from '../../../shared/components/insignias-empresa/insignias-empresa-list.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { descargarBlob } from '../../../shared/utils/download.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';

const ERROR_CARGA = 'No se pudieron cargar las insignias empresariales.';
const ERROR_DESCARGA = 'No fue posible descargar la insignia. Intenta nuevamente.';
const OPENBADGES_VALIDATOR_URL = 'https://certlister.com/ob3-validator/';

@Component({
  selector: 'app-insignias-empresa-page',
  imports: [ButtonComponent, IconComponent, InsigniasEmpresaListComponent, ShellLayoutComponent],
  templateUrl: './insignias-empresa-page.component.html',
  styleUrl: './insignias-empresa-page.component.scss',
})
export class InsigniasEmpresaPageComponent {
  private readonly empresaService = inject(EmpresaService);
  private readonly toastService = inject(ToastService);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly insignias = signal<InsigniaEmpresa[]>([]);

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'EMPRESA / INSIGNIAS',
    pageTitle: 'Insignias',
    showNotificationDot: true,
  }));

  constructor() {
    void this.cargarInsignias();
  }

  protected async cargarInsignias(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      this.insignias.set(await firstValueFrom(this.empresaService.listarInsignias()));
    } catch (err: unknown) {
      this.insignias.set([]);
      this.errorCarga.set(true);
      this.toastService.error(this.mensajeError(err));
    } finally {
      this.cargando.set(false);
    }
  }

  protected async descargarJsonLd(insignia: InsigniaEmpresa): Promise<void> {
    if (!insignia.idInsigniaEmpresa) {
      this.toastService.error(ERROR_DESCARGA);
      return;
    }

    try {
      const blob = await firstValueFrom(
        this.empresaService.descargarInsigniaJsonLd(insignia.idInsigniaEmpresa)
      );
      descargarBlob(blob, this.nombreArchivo(insignia));
    } catch {
      this.toastService.error(ERROR_DESCARGA);
    }
  }

  protected async descargarJwt(insignia: InsigniaEmpresa): Promise<void> {
    const urlJwt =
      insignia.urlVerificacionJwt ?? this.urlJwtDesdePublica(insignia.urlVerificacionPublica);
    if (!urlJwt) {
      this.toastService.error(ERROR_DESCARGA);
      return;
    }

    try {
      const blob = await firstValueFrom(this.empresaService.descargarInsigniaJwt(urlJwt));
      descargarBlob(blob, this.nombreArchivoJwt(insignia));
    } catch {
      this.toastService.error(ERROR_DESCARGA);
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
      window.open(this.urlValidadorOpenBadges(urlJwt), '_blank', 'noopener');
    }
  }

  private mensajeError(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 403) {
      return apiErrorMessage(err) ?? 'No tenés permiso para ver estas insignias.';
    }
    return apiErrorMessage(err) ?? ERROR_CARGA;
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
    return `${base || 'insignia'}-${insignia.idInsigniaEmpresa}.jsonld`;
  }

  private nombreArchivoJwt(insignia: InsigniaEmpresa): string {
    const base = `${insignia.nombre}-${insignia.nivelInsignia}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base || 'insignia'}-${insignia.idInsigniaEmpresa}.jwt`;
  }

  private urlValidadorOpenBadges(urlCredencial: string): string {
    return `${OPENBADGES_VALIDATOR_URL}?url=${encodeURIComponent(urlCredencial)}`;
  }

  private urlJwtDesdePublica(urlPublica?: string): string | null {
    if (!urlPublica) return null;
    return urlPublica.endsWith('/verificacion')
      ? `${urlPublica}.jwt`
      : urlPublica.replace(/\/verificacion$/, '/verificacion.jwt');
  }

  private nivelLabel(nivel: InsigniaEmpresa['nivelInsignia']): string {
    const labels: Record<InsigniaEmpresa['nivelInsignia'], string> = {
      bronce: 'Bronce',
      plata: 'Plata',
      oro: 'Oro',
    };
    return labels[nivel];
  }
}
