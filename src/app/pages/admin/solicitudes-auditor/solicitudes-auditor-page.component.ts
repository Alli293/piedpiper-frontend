import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import { ToastService } from '../../../shared/services/toast.service';
import {
  PaginaSolicitudes,
  SolicitudPendiente,
  ValidacionService,
} from '../../../core/validacion/validacion.service';

const MOTIVO_MIN = 10;
const MOTIVO_MAX = 500;

@Component({
  selector: 'app-solicitudes-auditor-page',
  imports: [ButtonComponent, TextareaComponent, DatePipe],
  templateUrl: './solicitudes-auditor-page.component.html',
  styleUrl: './solicitudes-auditor-page.component.scss',
})
export class SolicitudesAuditorPageComponent {
  private readonly validacionService = inject(ValidacionService);
  private readonly toastService = inject(ToastService);

  protected readonly cargando = signal(true);
  protected readonly pagina = signal<PaginaSolicitudes | null>(null);
  protected readonly solicitudEnRevision = signal<SolicitudPendiente | null>(null);
  protected readonly decision = signal<'aprobado' | 'rechazado' | null>(null);
  protected readonly motivo = signal('');
  protected readonly enviando = signal(false);

  protected readonly errorMotivo = computed(() => {
    if (this.decision() !== 'rechazado') {
      return '';
    }
    const largo = this.motivo().trim().length;
    if (largo === 0) {
      return 'Ingresa el motivo del rechazo.';
    }
    if (largo < MOTIVO_MIN || largo > MOTIVO_MAX) {
      return 'El motivo debe tener entre 10 y 500 caracteres.';
    }
    return '';
  });

  protected readonly puedeConfirmar = computed(() => {
    if (this.decision() === 'aprobado') {
      return true;
    }
    return this.decision() === 'rechazado' && this.errorMotivo() === '';
  });

  constructor() {
    this.cargar(0);
  }

  protected cargar(numeroPagina: number): void {
    this.cargando.set(true);
    this.validacionService.listarPendientes(numeroPagina).subscribe({
      next: (pagina) => {
        this.pagina.set(pagina);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.toastService.error(
          'No pudimos cargar las solicitudes',
          err?.error?.message ?? 'Intenta nuevamente.'
        );
      },
    });
  }

  protected abrirRevision(solicitud: SolicitudPendiente): void {
    this.solicitudEnRevision.set(solicitud);
    this.decision.set(null);
    this.motivo.set('');
  }

  protected cerrarRevision(): void {
    if (!this.enviando()) {
      this.solicitudEnRevision.set(null);
    }
  }

  protected confirmarDecision(): void {
    const solicitud = this.solicitudEnRevision();
    const decision = this.decision();
    if (!solicitud || !decision || !this.puedeConfirmar() || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.validacionService
      .resolver(solicitud.id, decision, decision === 'rechazado' ? this.motivo().trim() : undefined)
      .subscribe({
        next: (resuelta) => {
          this.enviando.set(false);
          this.solicitudEnRevision.set(null);
          this.toastService.success(
            resuelta.estado === 'APROBADO' ? 'Solicitud aprobada' : 'Solicitud rechazada',
            `El auditor ${solicitud.nombreAuditor} fue notificado por correo.`
          );
          this.cargar(this.paginaTrasResolver());
        },
        error: (err) => {
          this.enviando.set(false);
          this.solicitudEnRevision.set(null);
          this.toastService.error(
            'No se pudo aplicar la decisión',
            err?.error?.message ?? 'Intenta nuevamente.'
          );
          if (err?.status === 409) {
            this.cargar(this.paginaTrasResolver());
          }
        },
      });
  }

  private paginaTrasResolver(): number {
    const actual = this.pagina();
    const paginaActual = actual?.pagina ?? 0;
    const esUltimaDeLaPagina = (actual?.contenido.length ?? 0) <= 1;
    return esUltimaDeLaPagina && paginaActual > 0 ? paginaActual - 1 : paginaActual;
  }
}
