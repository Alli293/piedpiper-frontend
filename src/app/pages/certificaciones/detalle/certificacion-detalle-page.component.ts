import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Certificacion } from '../../../core/models/certificacion.model';
import { CertificacionesService } from '../../../core/services/certificaciones.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage, apiErrorMessageAsync } from '../../../shared/utils/http-error.utils';

const ERROR_CARGA_MENSAJE = 'No fue posible cargar esta sección. Intenta recargar la página.';
const ERROR_DESCARGA_MENSAJE = 'No fue posible descargar la certificación. Intenta nuevamente.';
const ORGANIZATION_NAME = 'CarbonHub';

@Component({
  selector: 'app-certificacion-detalle-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    DatePipe,
    HeadingComponent,
    IconComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './certificacion-detalle-page.component.html',
  styleUrl: './certificacion-detalle-page.component.scss',
})
export class CertificacionDetallePageComponent implements OnInit {
  private readonly certificacionesService = inject(CertificacionesService);
  private readonly toastService = inject(ToastService);

  readonly id = input.required<string>();

  protected readonly certificacion = signal<Certificacion | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly descargando = signal(false);

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'CERTIFICACIONES',
    pageTitle: this.certificacion()?.nombreCertificacion ?? 'Certificación',
    showNotificationDot: true,
    showBackButton: true,
  }));

  ngOnInit(): void {
    void this.cargarCertificacion();
  }

  protected etiquetaVigencia(): string {
    return this.certificacion()?.vigente ? 'Vigente' : 'Vencida';
  }

  protected varianteVigencia(): BadgeVariant {
    return this.certificacion()?.vigente ? 'success' : 'warning';
  }

  protected async descargarJsonLd(): Promise<void> {
    this.descargando.set(true);
    try {
      const blob = await firstValueFrom(this.certificacionesService.descargarJsonLd(this.id()));
      this.descargarBlob(blob, `certificacion-${this.id()}.jsonld`);
    } catch (error: unknown) {
      this.toastService.error((await apiErrorMessageAsync(error)) ?? ERROR_DESCARGA_MENSAJE);
    } finally {
      this.descargando.set(false);
    }
  }

  protected compartirEnLinkedIn(): void {
    const cert = this.certificacion();
    if (!cert) return;
    window.open(this.buildLinkedInShareUrl(cert), '_blank', 'noopener,noreferrer');
  }

  protected buildLinkedInShareUrl(cert: Certificacion): string {
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: cert.nombreCertificacion,
      organizationName: ORGANIZATION_NAME,
      certUrl: cert.urlVerificacion,
    });
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  }

  private descargarBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  private async cargarCertificacion(): Promise<void> {
    this.cargando.set(true);
    this.error.set(false);
    try {
      const certificacion = await firstValueFrom(this.certificacionesService.obtener(this.id()));
      this.certificacion.set(certificacion);
    } catch (err: unknown) {
      this.certificacion.set(null);
      this.error.set(true);
      this.toastService.error(apiErrorMessage(err) ?? ERROR_CARGA_MENSAJE);
    } finally {
      this.cargando.set(false);
    }
  }
}
