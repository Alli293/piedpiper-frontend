import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth-session.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { HeaderConfig } from '../../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { EcoRutaItinerariosService } from '../ecoruta-itinerarios.service';
import { ItinerarioResumen } from '../models/itinerario.model';
import {
  INFO_POR_CLASIFICACION,
  varianteDeClasificacion,
} from '../utils/clasificacion-ambiental.utils';
import { etiquetaProvincia } from '../utils/provincia.utils';

const ERROR_CARGA = 'No fue posible recuperar la información solicitada.';

@Component({
  selector: 'app-mis-itinerarios-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    DatePipe,
    DecimalPipe,
    HeadingComponent,
    IconComponent,
    ModalComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './mis-itinerarios-page.component.html',
  styleUrl: './mis-itinerarios-page.component.scss',
})
export class MisItinerariosPageComponent implements OnInit {
  private readonly itinerariosService = inject(EcoRutaItinerariosService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly itinerarios = signal<ItinerarioResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pagina = signal(1);
  protected readonly totalPaginas = signal(0);
  protected readonly totalResultados = signal(0);

  protected readonly confirmTarget = signal<ItinerarioResumen | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  /** Mismo guard que `ListadoAuditoriasPageComponent`: solo se aplica la respuesta vigente. */
  private ultimoPedido = 0;

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'ECORUTA',
    pageTitle: 'Mis itinerarios',
    showNotificationDot: false,
    userInitials: this.authSession.getUserInitials(),
  }));

  protected readonly hayPaginaAnterior = computed(() => this.pagina() > 1);
  protected readonly hayPaginaSiguiente = computed(() => this.pagina() < this.totalPaginas());

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  protected irAPagina(numero: number): void {
    if (numero < 1 || numero > this.totalPaginas() || numero === this.pagina()) return;
    this.pagina.set(numero);
    void this.cargar();
  }

  protected nuevoItinerario(): void {
    void this.router.navigateByUrl('/ecoruta/preferencias');
  }

  protected abrir(itinerarioId: string): void {
    void this.router.navigateByUrl(`/ecoruta/itinerarios/${itinerarioId}`);
  }

  protected tituloDe(item: ItinerarioResumen): string {
    if (item.provinciasVisitadas.length === 0) return 'Itinerario en Costa Rica';
    return item.provinciasVisitadas.map((codigo) => etiquetaProvincia(codigo)).join(' · ');
  }

  protected textoClasificacion(item: ItinerarioResumen): string {
    if (!item.clasificacionAmbiental) return '';
    return INFO_POR_CLASIFICACION[item.clasificacionAmbiental]?.texto ?? '';
  }

  protected varianteDe(item: ItinerarioResumen) {
    return varianteDeClasificacion(item.clasificacionAmbiental);
  }

  protected solicitarEliminar(item: ItinerarioResumen): void {
    this.confirmTarget.set(item);
  }

  protected cancelarEliminar(): void {
    this.confirmTarget.set(null);
  }

  protected async confirmarEliminar(): Promise<void> {
    const item = this.confirmTarget();
    if (!item || this.deletingId()) return;

    this.deletingId.set(item.id);
    try {
      await firstValueFrom(this.itinerariosService.eliminar(item.id));
      this.itinerarios.update((actuales) => actuales.filter((actual) => actual.id !== item.id));
      this.totalResultados.update((total) => Math.max(0, total - 1));
      this.toastService.success('Itinerario eliminado.');
      this.confirmTarget.set(null);
      // Si esa era la última fila visible en una página distinta a la primera, retroceder y
      // volver a pedir esa página en vez de mostrar el estado vacío general con datos aún
      // existentes en páginas anteriores.
      if (this.itinerarios().length === 0 && this.pagina() > 1) {
        this.pagina.update((numero) => numero - 1);
        await this.cargar();
      }
    } catch (error: unknown) {
      this.manejarErrorEliminacion(error);
    } finally {
      this.deletingId.set(null);
    }
  }

  private async cargar(): Promise<void> {
    const pedido = ++this.ultimoPedido;
    this.cargando.set(true);
    this.error.set(null);
    try {
      const respuesta = await firstValueFrom(
        this.itinerariosService.listar({ pagina: this.pagina() })
      );
      if (pedido !== this.ultimoPedido) return;
      this.itinerarios.set(respuesta.contenido);
      this.totalPaginas.set(respuesta.totalPaginas);
      this.totalResultados.set(respuesta.totalResultados);
      this.pagina.set(respuesta.paginaActual);
    } catch (err: unknown) {
      if (pedido !== this.ultimoPedido) return;
      this.error.set(apiErrorMessage(err) ?? ERROR_CARGA);
    } finally {
      if (pedido === this.ultimoPedido) {
        this.cargando.set(false);
      }
    }
  }

  private manejarErrorEliminacion(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        this.toastService.error(
          apiErrorMessage(error) ?? 'No tienes permiso para modificar este itinerario.'
        );
        return;
      }
      if (error.status === 404) {
        this.toastService.error(
          apiErrorMessage(error) ?? 'El itinerario solicitado no existe o ya no está disponible.'
        );
        this.confirmTarget.set(null);
        void this.cargar();
        return;
      }
    }
    this.toastService.error(
      apiErrorMessage(error) ??
        'No fue posible actualizar el estado del itinerario. Intenta nuevamente.'
    );
  }
}
