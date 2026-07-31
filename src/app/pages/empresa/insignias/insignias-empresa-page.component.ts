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
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';

const ERROR_CARGA = 'No se pudieron cargar las insignias empresariales.';
const ERROR_DESCARGA = 'No fue posible descargar la insignia. Intenta nuevamente.';

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
      this.descargarBlob(blob, this.nombreArchivo(insignia));
    } catch {
      this.toastService.error(ERROR_DESCARGA);
    }
  }

  protected compartirLinkedIn(insignia: InsigniaEmpresa): void {
    if (insignia.urlLinkedIn) {
      window.open(insignia.urlLinkedIn, '_blank', 'noopener');
    }
  }

  protected verificarOpenBadges(insignia: InsigniaEmpresa): void {
    if (insignia.urlVerificacionPublica) {
      window.open(insignia.urlVerificacionPublica, '_blank', 'noopener');
    }
  }

  private mensajeError(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 403) {
      return apiErrorMessage(err) ?? 'No tenés permiso para ver estas insignias.';
    }
    return apiErrorMessage(err) ?? ERROR_CARGA;
  }

  private descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    URL.revokeObjectURL(url);
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
}
