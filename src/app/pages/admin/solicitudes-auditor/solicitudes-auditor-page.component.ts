import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import {
  PaginaSolicitudes,
  SolicitudPendiente,
  ValidacionService,
} from '../../../core/validacion/validacion.service';

@Component({
  selector: 'app-solicitudes-auditor-page',
  imports: [
    ShellLayoutComponent,
    ButtonComponent,
    CardComponent,
    HeadingComponent,
    IconComponent,
    DatePipe,
  ],
  templateUrl: './solicitudes-auditor-page.component.html',
  styleUrl: './solicitudes-auditor-page.component.scss',
})
export class SolicitudesAuditorPageComponent {
  /**
   * La pantalla vivía sin shell, así que el administrador de plataforma no tenía menú, ni forma de
   * cerrar sesión, ni de llegar acá desde ningún lado: aterrizaba en un placeholder vacío.
   */
  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'ADMINISTRACIÓN',
    pageTitle: 'Solicitudes de auditores',
    showNotificationDot: false,
  };

  private readonly validacionService = inject(ValidacionService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly pagina = signal<PaginaSolicitudes | null>(null);

  constructor() {
    this.cargar(0);
  }

  protected cargar(numeroPagina: number): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.validacionService
      .listarPendientes(numeroPagina)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pagina) => {
          this.pagina.set(pagina);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.errorCarga.set(true);
          this.toastService.error(
            'No pudimos cargar las solicitudes',
            apiErrorMessage(err) ?? 'Intenta nuevamente.'
          );
        },
      });
  }

  protected abrirRevision(solicitud: SolicitudPendiente): void {
    this.router.navigateByUrl(`/admin/solicitudes-auditor/${solicitud.id}`).catch(() => {});
  }
}
