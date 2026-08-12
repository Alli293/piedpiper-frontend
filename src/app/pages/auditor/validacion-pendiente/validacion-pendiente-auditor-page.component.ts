import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfiguracionInicialLayoutComponent } from '../../../shared/layouts/configuracion-inicial-layout/configuracion-inicial-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SemanticCardComponent } from '../../../shared/components/semantic-card/semantic-card.component';
import { LinkDirective } from '../../../shared/components/link/link.directive';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionService } from '../../../core/auth-session.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  MiSolicitudAuditor,
  MiSolicitudAuditorService,
} from '../../../core/validacion/mi-solicitud-auditor.service';

type EstadoPaso = 'listo' | 'en-progreso' | 'pendiente';

interface PasoEstado {
  titulo: string;
  fecha: Date | null;
  estado: EstadoPaso;
  detalle?: string;
}

@Component({
  selector: 'app-validacion-pendiente-auditor-page',
  imports: [
    ConfiguracionInicialLayoutComponent,
    ButtonComponent,
    HeadingComponent,
    BadgeComponent,
    IconComponent,
    SemanticCardComponent,
    LinkDirective,
    DatePipe,
  ],
  templateUrl: './validacion-pendiente-auditor-page.component.html',
  styleUrl: './validacion-pendiente-auditor-page.component.scss',
})
export class ValidacionPendienteAuditorPageComponent implements OnInit {
  private readonly miSolicitudAuditorService = inject(MiSolicitudAuditorService);
  private readonly authService = inject(AuthService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly solicitud = signal<MiSolicitudAuditor | null>(null);

  protected readonly userEmail = computed(() => this.authSessionService.getUserEmail());
  protected readonly rechazado = computed(() => this.solicitud()?.estado === 'RECHAZADO');

  protected readonly pasos = computed<PasoEstado[]>(() => {
    const solicitud = this.solicitud();
    const fechaSolicitud = solicitud ? new Date(solicitud.fechaSolicitud) : null;
    const enRevision = solicitud?.estado === 'PENDIENTE';
    const aprobado = solicitud?.estado === 'APROBADO';

    return [
      { titulo: 'Cuenta creada', fecha: fechaSolicitud, estado: 'listo' },
      { titulo: 'Documentos enviados', fecha: fechaSolicitud, estado: 'listo' },
      {
        titulo: 'Verificación de credenciales',
        fecha: null,
        estado: aprobado ? 'listo' : 'en-progreso',
        detalle: enRevision ? 'En proceso · 2-5 días hábiles' : undefined,
      },
      {
        titulo: 'Cuenta activada',
        fecha: aprobado && solicitud!.fechaResolucion ? new Date(solicitud!.fechaResolucion) : null,
        estado: aprobado ? 'listo' : 'pendiente',
        detalle: aprobado ? undefined : 'Pendiente',
      },
    ];
  });

  ngOnInit(): void {
    void this.cargarSolicitud();
  }

  protected cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigateByUrl('/login').catch(() => {});
  }

  protected async continuar(): Promise<void> {
    if (this.authService.estado() === 'ACTIVO') {
      await this.router.navigateByUrl('/auditor/auditorias');
      return;
    }

    // El backend re-emite el JWT en cada llamada autenticada (incluida la que trajo el
    // "APROBADO" que habilitó este botón), pero no queremos depender en silencio de ese
    // timing: si el estado local sigue sin reflejarlo, `guardAuditorActivo` rebotaría al
    // auditor de vuelta acá sin explicación. Preferimos pedirle explícitamente que vuelva
    // a iniciar sesión.
    this.authService.cerrarSesion();
    this.toastService.info('Tu cuenta ya fue aprobada', 'Inicia sesión de nuevo para continuar.');
    await this.router.navigateByUrl('/login');
  }

  private async cargarSolicitud(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const solicitud = await firstValueFrom(this.miSolicitudAuditorService.obtener());
      this.solicitud.set(solicitud);
    } catch {
      this.errorCarga.set(true);
    } finally {
      this.cargando.set(false);
    }
  }
}
