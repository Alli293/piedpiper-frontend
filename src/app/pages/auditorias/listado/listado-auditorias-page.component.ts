import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../../core/auth-session.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { ResumenSolicitudAuditoria } from '../auditoria.model';
import { variantePorEstadoAuditoria } from '../auditoria-estado.utils';
import { AuditoriasService } from '../auditorias.service';

const ERROR_CARGA = 'No se pudieron cargar las auditorías. Intenta nuevamente.';

@Component({
  selector: 'app-listado-auditorias-page',
  imports: [BadgeComponent, ButtonComponent, DatePipe, HeadingComponent, ShellLayoutComponent],
  templateUrl: './listado-auditorias-page.component.html',
  styleUrl: './listado-auditorias-page.component.scss',
})
export class ListadoAuditoriasPageComponent implements OnInit {
  /**
   * La misma pantalla sirve a los dos roles porque muestran lo mismo: solo cambia de dónde sale la
   * lista y si se puede crear una solicitud. Duplicarla en dos componentes casi idénticos las haría
   * divergir en cuanto alguien toque una sola.
   */
  readonly perspectiva = input<'empresa' | 'auditor'>('empresa');

  private readonly auditoriasService = inject(AuditoriasService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected readonly solicitudes = signal<ResumenSolicitudAuditoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly esEmpresa = computed(() => this.perspectiva() === 'empresa');

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'AUDITORÍAS',
    pageTitle: this.esEmpresa() ? 'Auditorías' : 'Solicitudes asignadas',
    showNotificationDot: true,
    userInitials: this.authSession.getUserInitials(),
  }));

  protected readonly rutaInicio = computed(() =>
    this.esEmpresa() ? '/empresa/panel' : '/auditor/panel'
  );

  /**
   * Las que esperan respuesta del auditor van primero: es lo único que tiene un plazo corriendo, y
   * enterrarlas entre las ya respondidas es como se pierde una por vencimiento.
   */
  protected readonly ordenadas = computed(() =>
    [...this.solicitudes()].sort(
      (a, b) => Number(this.esperaRespuesta(b)) - Number(this.esperaRespuesta(a))
    )
  );

  /** El detalle es el mismo para ambos roles, pero cada uno lo ve bajo su propia sección. */
  private readonly rutaDetalle = computed(() =>
    this.esEmpresa() ? '/empresa/auditorias' : '/auditor/auditorias'
  );

  async ngOnInit(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const peticion = this.esEmpresa()
        ? this.auditoriasService.listarDeMiEmpresa()
        : this.auditoriasService.listarAsignadas();
      this.solicitudes.set(await firstValueFrom(peticion));
    } catch (err: unknown) {
      this.error.set(apiErrorMessage(err) ?? ERROR_CARGA);
    } finally {
      this.cargando.set(false);
    }
  }

  protected readonly varianteDe = variantePorEstadoAuditoria;

  protected esperaRespuesta(solicitud: ResumenSolicitudAuditoria): boolean {
    return solicitud.idAuditor !== null && solicitud.fechaAceptacion === null;
  }

  protected verDetalle(idSolicitud: string): void {
    void this.router.navigate([this.rutaDetalle(), idSolicitud]);
  }

  protected nuevaSolicitud(): void {
    void this.router.navigateByUrl('/empresa/auditorias/nueva');
  }
}
