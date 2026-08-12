import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly pagina = signal<PaginaSolicitudes | null>(null);

  constructor() {
    const paginaInicial = Number(this.route.snapshot.queryParamMap.get('pagina')) || 0;
    this.cargar(paginaInicial);
  }

  protected cargar(numeroPagina: number): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.validacionService
      .listarPendientes(numeroPagina)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pagina) => {
          // Volver a una página que quedó vacía (se resolvió su última solicitud, o llegó por un
          // enlace/bookmark viejo apuntando muy adelante) manda al admin a la última página con
          // contenido en vez de mostrarle un "cola al día" engañoso. Salta directo con
          // `totalPaginas` en lugar de retroceder de a una, para no encadenar una petición HTTP
          // por cada página vacía intermedia.
          const ultimaPaginaValida = Math.max(pagina.totalPaginas - 1, 0);
          if (
            pagina.contenido.length === 0 &&
            numeroPagina > 0 &&
            ultimaPaginaValida !== numeroPagina
          ) {
            this.cargar(ultimaPaginaValida);
            return;
          }
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

  protected irARevision(solicitud: SolicitudPendiente): void {
    this.router
      .navigate([`/admin/solicitudes-auditor/${solicitud.id}`], {
        queryParams: { pagina: this.pagina()?.pagina ?? 0 },
      })
      .catch(() => {});
  }
}
