import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthSessionService } from '../../../core/auth-session.service';
import {
  PerfilPublicoAuditorResponse,
  ResenaVerificada,
} from '../../../core/models/perfil-publico-auditor.model';
import { PerfilPublicoAuditorService } from '../../../core/perfil-auditor/perfil-publico-auditor.service';
import { ToastService } from '../../../shared/services/toast.service';

type ErrorTipo = 'none' | '404' | '5xx';

@Component({
  selector: 'app-perfil-publico-auditor-page',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './perfil-publico-auditor-page.component.html',
  styleUrl: './perfil-publico-auditor-page.component.scss',
})
export class PerfilPublicoAuditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly perfilService = inject(PerfilPublicoAuditorService);
  private readonly toastService = inject(ToastService);
  private readonly authSession = inject(AuthSessionService);

  protected readonly cargando = signal(true);
  protected readonly perfil = signal<PerfilPublicoAuditorResponse | null>(null);
  protected readonly error = signal(false);
  protected readonly errorTipo = signal<ErrorTipo>('none');

  protected readonly esAdminEmpresa = computed(() => this.authSession.isAdministradorEmpresa());

  protected readonly resenasOrdenadas = computed<ResenaVerificada[]>(() => {
    const perfil = this.perfil();
    if (!perfil || !perfil.resenas.length) return [];
    return [...perfil.resenas].sort(
      (a, b) => new Date(b.fechaCalificacion).getTime() - new Date(a.fechaCalificacion).getTime()
    );
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

  private async cargarPerfil(auditorId: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(false);
    this.errorTipo.set('none');
    this.perfil.set(null);

    try {
      const resultado = await firstValueFrom(
        this.perfilService.obtenerPerfilPublico(auditorId)
      );
      this.perfil.set(resultado);
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
}
