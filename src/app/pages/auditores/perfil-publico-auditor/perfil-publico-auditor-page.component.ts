import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthSessionService } from '../../../core/auth-session.service';
import { CalificacionResponse } from '../../../core/calificacion/calificacion.models';
import { CalificacionService } from '../../../core/calificacion/calificacion.service';
import {
  PerfilPublicoAuditorResponse,
  ResenaVerificada,
} from '../../../core/models/perfil-publico-auditor.model';
import { PerfilPublicoAuditorService } from '../../../core/perfil-auditor/perfil-publico-auditor.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { AuditoriasService } from '../../auditorias/auditorias.service';
import { CalificacionFormComponent } from './calificacion-form/calificacion-form.component';

type ErrorTipo = 'none' | '404' | '5xx';

@Component({
  selector: 'app-perfil-publico-auditor-page',
  standalone: true,
  imports: [
    DatePipe,
    AvatarComponent,
    BadgeComponent,
    CardComponent,
    IconComponent,
    ShellLayoutComponent,
    CalificacionFormComponent,
  ],
  templateUrl: './perfil-publico-auditor-page.component.html',
  styleUrl: './perfil-publico-auditor-page.component.scss',
})
export class PerfilPublicoAuditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly perfilService = inject(PerfilPublicoAuditorService);
  private readonly toastService = inject(ToastService);
  private readonly authSession = inject(AuthSessionService);
  private readonly auditoriasService = inject(AuditoriasService);
  private readonly calificacionService = inject(CalificacionService);

  protected readonly cargando = signal(true);
  protected readonly perfil = signal<PerfilPublicoAuditorResponse | null>(null);
  protected readonly error = signal(false);
  protected readonly errorTipo = signal<ErrorTipo>('none');

  /** Datos de calificación para el componente CalificacionForm */
  protected readonly auditoriaId = signal<string>('');
  protected readonly estadoAuditoria = signal<string>('');
  protected readonly calificacionExistente = signal<CalificacionResponse | null>(null);
  protected readonly empresaIdUsuario = signal<string>('');

  protected readonly esAdminEmpresa = computed(() => this.authSession.isAdministradorEmpresa());

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'AUDITORES · DIRECTORIO DE AUDITORES',
    pageTitle: 'Perfil del auditor',
    showNotificationDot: true,
  }));

  protected readonly resenasOrdenadas = computed<ResenaVerificada[]>(() => {
    const perfil = this.perfil();
    if (!perfil || !perfil.resenas.length) return [];
    return [...perfil.resenas].sort(
      (a, b) => new Date(b.fechaCalificacion).getTime() - new Date(a.fechaCalificacion).getTime()
    );
  });

  protected readonly iniciales = computed(() => {
    const perfil = this.perfil();
    if (!perfil) return '';
    const partes = perfil.nombre.split(' ').filter((p) => p.length > 0);
    if (partes.length === 0) return '';
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  });

  protected readonly certificacionesVencidas = computed(() => {
    const perfil = this.perfil();
    if (!perfil) return 0;
    return perfil.certificaciones.filter((c) => c.vencida).length;
  });

  protected readonly maxSectorPorcentaje = computed(() => {
    const perfil = this.perfil();
    if (!perfil || perfil.distribucionSectores.length === 0) return 100;
    return Math.max(...perfil.distribucionSectores.map((s) => s.porcentaje));
  });

  ngOnInit(): void {
    const auditorId = this.route.snapshot.paramMap.get('id') ?? '';
    void this.cargarPerfil(auditorId);
  }

  protected volverAlDirectorio(): void {
    void this.router.navigate(['/auditores']);
  }

  protected irAAsignarAuditoria(): void {
    const perfil = this.perfil();
    if (perfil) {
      void this.router.navigate(['/auditorias/asignar'], {
        queryParams: { auditorId: perfil.auditorId },
      });
    }
  }

  protected formatearEspecialidad(valor: string): string {
    return valor
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  protected generarEstrellas(calificacion: number): boolean[] {
    const estrellas: boolean[] = [];
    for (let i = 1; i <= 5; i++) {
      estrellas.push(i <= Math.round(calificacion));
    }
    return estrellas;
  }

  /** Signal que indica si se está editando inline en el perfil público. */
  protected readonly editandoResenaInline = signal(false);

  /**
   * Activa el formulario de edición inline dentro del perfil público.
   */
  protected editarResena(resena: ResenaVerificada): void {
    if (this.auditoriaId()) {
      const calificacionFromResena: CalificacionResponse = {
        id: resena.id,
        auditoriaId: this.auditoriaId(),
        auditorId: this.perfil()?.auditorId ?? '',
        empresaId: resena.empresaId,
        calificacion: resena.calificacion,
        comentario: resena.comentario,
        creadoEn: resena.fechaCalificacion,
        actualizadoEn: resena.fechaCalificacion,
      };
      this.calificacionExistente.set(calificacionFromResena);
      this.empresaIdUsuario.set(resena.empresaId);
      this.editandoResenaInline.set(true);

      setTimeout(() => {
        const formSection = document.querySelector('app-calificacion-form');
        formSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  private async cargarPerfil(auditorId: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(false);
    this.errorTipo.set('none');
    this.perfil.set(null);

    try {
      const resultado = await firstValueFrom(this.perfilService.obtenerPerfilPublico(auditorId));
      this.perfil.set(resultado);

      if (this.esAdminEmpresa()) {
        void this.cargarContextoCalificacion(auditorId);
      }
    } catch (err: unknown) {
      this.error.set(true);
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.errorTipo.set('404');
      } else {
        this.errorTipo.set('5xx');
        this.toastService.error(
          'No se pudo cargar el perfil del auditor. Intente nuevamente.',
          undefined,
          5000
        );
      }
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Carga la auditoría con estado CERTIFICACION_EMITIDA del auditor actual
   * y la calificación existente (si la hay) para alimentar el componente de calificación.
   * También establece empresaIdUsuario para comparar con reseñas del perfil público.
   */
  private async cargarContextoCalificacion(auditorId: string): Promise<void> {
    try {
      const auditorias = await firstValueFrom(this.auditoriasService.listarDeMiEmpresa());
      const auditoriaCalificable = auditorias.find(
        (a) => a.idAuditor === auditorId && a.estado === 'CERTIFICACION_EMITIDA'
      );

      if (!auditoriaCalificable) return;

      this.auditoriaId.set(auditoriaCalificable.id);
      this.estadoAuditoria.set(auditoriaCalificable.estado);

      const calificacion = await firstValueFrom(
        this.calificacionService.obtenerPorAuditoria(auditoriaCalificable.id)
      );
      this.calificacionExistente.set(calificacion);
      if (calificacion) {
        this.empresaIdUsuario.set(calificacion.empresaId);
      }
    } catch {
      // Si falla la carga de contexto de calificación, no mostrar el formulario.
      // No se muestra error al usuario — el formulario simplemente no aparece.
    }
  }
}
