import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { inicialesDe } from '../../shared/utils/iniciales.utils';
import { AuditoresService } from './auditores.service';
import {
  AuditorResumen,
  esOrdenamientoValido,
  LONGITUD_MAXIMA_BUSQUEDA,
  LONGITUD_MINIMA_BUSQUEDA,
  OrdenamientoAuditores,
  PaginaAuditores,
} from './auditor.model';

const ESPECIALIDAD_ETIQUETAS: Record<string, string> = {
  AGROINDUSTRIA: 'Agroindustria',
  ENERGIA_RENOVABLE: 'Energía renovable',
  LOGISTICA_TRANSPORTE: 'Logística y transporte',
  MANUFACTURA: 'Manufactura',
  TURISMO_SOSTENIBLE: 'Turismo sostenible',
};

const PROVINCIA_ETIQUETAS: Record<string, string> = {
  SAN_JOSE: 'San José',
  ALAJUELA: 'Alajuela',
  CARTAGO: 'Cartago',
  HEREDIA: 'Heredia',
  GUANACASTE: 'Guanacaste',
  PUNTARENAS: 'Puntarenas',
  LIMON: 'Limón',
};

const TOTAL_ESTRELLAS = 5;

interface TarjetaAuditor {
  auditor: AuditorResumen;
  iniciales: string;
  estrellas: boolean[];
  ubicacion: string;
  etiquetas: string[];
}

@Component({
  selector: 'app-directorio-auditores-page',
  imports: [
    RouterLink,
    ShellLayoutComponent,
    TextInputComponent,
    SelectInputComponent,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
  ],
  templateUrl: './directorio-auditores-page.component.html',
  styleUrl: './directorio-auditores-page.component.scss',
})
export class DirectorioAuditoresPageComponent {
  private readonly auditoresService = inject(AuditoresService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly terminoBusqueda = signal('');
  protected readonly ordenamiento = signal<OrdenamientoAuditores>('CALIFICACION');
  protected readonly pagina = signal(0);
  private readonly recarga = signal(0);

  protected readonly resultado = signal<PaginaAuditores | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);

  protected readonly ordenOpciones: SelectOption[] = [
    { value: 'CALIFICACION', label: 'Calificación' },
    { value: 'AUDITORIAS_COMPLETADAS', label: 'Auditorías completadas' },
    { value: 'TIEMPO_RESPUESTA', label: 'Tiempo de respuesta' },
  ];

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'AUDITORES',
    pageTitle: 'Directorio de Auditores',
    showNotificationDot: true,
    userInitials: this.authSession.getUserInitials(),
  }));

  protected readonly avisoBusqueda = computed(() =>
    this.terminoBusqueda().trim().length === 1 ? 'Ingrese al menos 2 caracteres para buscar.' : ''
  );

  protected readonly sinResultados = computed(
    () => !this.cargando() && !this.error() && this.resultado()?.contenido.length === 0
  );

  protected readonly tarjetas = computed<TarjetaAuditor[]>(
    () => this.resultado()?.contenido.map((auditor) => this.tarjeta(auditor)) ?? []
  );

  protected readonly paginas = computed<number[]>(() =>
    Array.from({ length: this.resultado()?.totalPaginas ?? 0 }, (_, indice) => indice)
  );

  private readonly criterios = computed(() => ({
    termino: this.terminoNormalizado(),
    orden: this.ordenamiento(),
    pagina: this.pagina(),
    recarga: this.recarga(),
  }));

  constructor() {
    this.iniciarBusquedaReactiva();
  }

  protected onBuscar(valor: string): void {
    this.terminoBusqueda.set(valor);
    this.pagina.set(0);
  }

  protected onOrdenar(valor: string): void {
    if (!esOrdenamientoValido(valor)) {
      return;
    }
    this.ordenamiento.set(valor);
    this.pagina.set(0);
  }

  protected irAPagina(numeroPagina: number): void {
    this.pagina.set(numeroPagina);
  }

  protected reintentar(): void {
    this.recarga.update((valor) => valor + 1);
  }

  private iniciarBusquedaReactiva(): void {
    toObservable(this.criterios)
      .pipe(
        debounceTime(250),
        distinctUntilChanged(
          (a, b) =>
            a.termino === b.termino &&
            a.orden === b.orden &&
            a.pagina === b.pagina &&
            a.recarga === b.recarga
        ),
        tap(() => {
          this.cargando.set(true);
          this.error.set(false);
        }),
        switchMap((criterio) =>
          this.auditoresService
            .listar({
              terminoBusqueda: criterio.termino,
              pagina: criterio.pagina,
              ordenamiento: criterio.orden,
            })
            .pipe(
              catchError((err: unknown) => {
                this.error.set(true);
                this.toastService.error(
                  apiErrorMessage(err) ??
                    'No se pudo cargar el directorio de auditores. Intente nuevamente.',
                  undefined,
                  5000
                );
                return of(null);
              })
            )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((pagina) => {
        this.cargando.set(false);
        if (pagina) {
          this.resultado.set(pagina);
        }
      });
  }

  private terminoNormalizado(): string {
    const termino = this.terminoBusqueda().trim();
    if (termino.length < LONGITUD_MINIMA_BUSQUEDA || termino.length > LONGITUD_MAXIMA_BUSQUEDA) {
      return '';
    }
    return termino;
  }

  private tarjeta(auditor: AuditorResumen): TarjetaAuditor {
    const redondeada =
      auditor.calificacionPromedio === null ? 0 : Math.round(auditor.calificacionPromedio);
    const provincia = auditor.provincia ? PROVINCIA_ETIQUETAS[auditor.provincia] : null;
    const experiencia =
      auditor.aniosExperiencia !== null ? `${auditor.aniosExperiencia} años exp.` : null;
    return {
      auditor,
      iniciales: inicialesDe(auditor.nombre),
      estrellas: Array.from({ length: TOTAL_ESTRELLAS }, (_, indice) => indice < redondeada),
      ubicacion: [provincia, experiencia]
        .filter((parte): parte is string => parte !== null)
        .join(' · '),
      etiquetas: auditor.especialidadesPrincipales.map(
        (clave) => ESPECIALIDAD_ETIQUETAS[clave] ?? clave
      ),
    };
  }
}
