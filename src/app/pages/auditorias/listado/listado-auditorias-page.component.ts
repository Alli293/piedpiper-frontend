import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../../core/auth-session.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import {
  ESTADOS_FILTRABLES,
  ETIQUETAS_ESTADO_AUDITORIA,
  EstadoSolicitudAuditoria,
  ResumenSolicitudAuditoria,
} from '../auditoria.model';
import { variantePorEstadoAuditoria } from '../auditoria-estado.utils';
import { AuditoriasService } from '../auditorias.service';

const ERROR_CARGA =
  'No fue posible cargar tus solicitudes de auditoría. Intenta recargar la página.';

@Component({
  selector: 'app-listado-auditorias-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CheckboxComponent,
    DatePipe,
    HeadingComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './listado-auditorias-page.component.html',
  styleUrl: './listado-auditorias-page.component.scss',
})
export class ListadoAuditoriasPageComponent implements OnInit {
  /**
   * La misma pantalla sirve a los dos roles porque muestran lo mismo: solo cambia el encabezado y
   * si se puede crear una solicitud. De dónde sale la lista ya no cambia — el backend resuelve el
   * listado por el rol del token, así que ambos piden el mismo endpoint.
   */
  readonly perspectiva = input<'empresa' | 'auditor'>('empresa');

  private readonly auditoriasService = inject(AuditoriasService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected readonly solicitudes = signal<ResumenSolicitudAuditoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pagina = signal(1);
  protected readonly totalPaginas = signal(0);
  protected readonly totalResultados = signal(0);
  protected readonly estadosSeleccionados = signal<ReadonlySet<EstadoSolicitudAuditoria>>(
    new Set()
  );
  protected readonly mostrandoFiltros = signal(false);
  protected readonly tamanioPagina = signal(0);

  /**
   * Identifica al pedido más reciente. Cambiar un filtro o paginar no cancela el pedido anterior,
   * así que dos pueden estar en vuelo a la vez; si el que llega segundo es el viejo, pintaría un
   * resultado que el usuario ya abandonó, sin ningún error visible. Solo se aplica la respuesta
   * cuyo id sigue siendo el vigente.
   */
  private ultimoPedido = 0;

  protected readonly esEmpresa = computed(() => this.perspectiva() === 'empresa');
  protected readonly estadosFiltrables = ESTADOS_FILTRABLES;
  protected readonly etiquetaDe = ETIQUETAS_ESTADO_AUDITORIA;
  protected readonly varianteDe = variantePorEstadoAuditoria;

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'AUDITORÍAS',
    pageTitle: this.esEmpresa() ? 'Auditorías' : 'Solicitudes asignadas',
    showNotificationDot: true,
    userInitials: this.authSession.getUserInitials(),
  }));

  protected readonly rutaInicio = computed(() =>
    this.esEmpresa() ? '/empresa/panel' : '/auditor/panel'
  );

  protected readonly cantidadFiltros = computed(() => this.estadosSeleccionados().size);
  protected readonly hayFiltros = computed(() => this.cantidadFiltros() > 0);

  protected readonly hayPaginaAnterior = computed(() => this.pagina() > 1);
  protected readonly hayPaginaSiguiente = computed(() => this.pagina() < this.totalPaginas());

  /**
   * Rango que se está viendo, calculado con el tamaño de página del backend. Con el filtro puesto,
   * "1–3 de 3" es lo que le dice al usuario que el listado se acortó por su filtro y no porque
   * falten datos.
   */
  protected readonly rangoVisible = computed(() => {
    const total = this.totalResultados();
    if (total === 0 || this.tamanioPagina() === 0) return '';
    const desde = (this.pagina() - 1) * this.tamanioPagina() + 1;
    const hasta = desde + this.solicitudes().length - 1;
    return `${desde}–${hasta} de ${total}`;
  });

  /** El detalle es el mismo para ambos roles, pero cada uno lo ve bajo su propia sección. */
  private readonly rutaDetalle = computed(() =>
    this.esEmpresa() ? '/empresa/auditorias' : '/auditor/auditorias'
  );

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  protected estaSeleccionado(estado: EstadoSolicitudAuditoria): boolean {
    return this.estadosSeleccionados().has(estado);
  }

  /**
   * Cambiar un filtro vuelve a la página 1: si el usuario estaba en la página 3 y filtra hasta
   * dejar una sola página, quedaría mirando una página que ya no existe.
   */
  protected alternarEstado(estado: EstadoSolicitudAuditoria, marcado: boolean): void {
    const siguientes = new Set(this.estadosSeleccionados());
    if (marcado) {
      siguientes.add(estado);
    } else {
      siguientes.delete(estado);
    }
    this.estadosSeleccionados.set(siguientes);
    this.pagina.set(1);
    void this.cargar();
  }

  protected limpiarFiltros(): void {
    this.estadosSeleccionados.set(new Set());
    this.pagina.set(1);
    void this.cargar();
  }

  protected alternarPanelFiltros(): void {
    this.mostrandoFiltros.update((abierto) => !abierto);
  }

  protected irAPagina(numero: number): void {
    if (numero < 1 || numero > this.totalPaginas() || numero === this.pagina()) return;
    this.pagina.set(numero);
    void this.cargar();
  }

  protected verDetalle(idSolicitud: string): void {
    void this.router.navigate([this.rutaDetalle(), idSolicitud]);
  }

  protected nuevaSolicitud(): void {
    void this.router.navigateByUrl('/empresa/auditorias/nueva');
  }

  protected esperaRespuesta(solicitud: ResumenSolicitudAuditoria): boolean {
    return solicitud.idAuditor !== null && solicitud.fechaAceptacion === null;
  }

  private async cargar(): Promise<void> {
    const pedido = ++this.ultimoPedido;
    this.cargando.set(true);
    this.error.set(null);
    try {
      const respuesta = await firstValueFrom(
        this.auditoriasService.listar({
          filtroEstado: [...this.estadosSeleccionados()],
          pagina: this.pagina(),
        })
      );
      if (pedido !== this.ultimoPedido) return;
      this.solicitudes.set(respuesta.contenido);
      this.totalPaginas.set(respuesta.totalPaginas);
      this.totalResultados.set(respuesta.totalResultados);
      this.tamanioPagina.set(respuesta.tamanioPagina);
      this.pagina.set(respuesta.paginaActual);
    } catch (err: unknown) {
      if (pedido !== this.ultimoPedido) return;
      this.error.set(apiErrorMessage(err) ?? ERROR_CARGA);
    } finally {
      // Solo el pedido vigente apaga el indicador: si lo apagara uno viejo, la pantalla diría que
      // terminó de cargar mientras el actual sigue en vuelo.
      if (pedido === this.ultimoPedido) {
        this.cargando.set(false);
      }
    }
  }
}
