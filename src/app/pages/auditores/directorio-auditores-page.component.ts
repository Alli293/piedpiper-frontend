import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CheckboxComponent } from '../../shared/components/inputs/checkbox/checkbox.component';
import { RadioComponent } from '../../shared/components/inputs/radio/radio.component';
import { RadioGroupDirective } from '../../shared/components/inputs/radio/radio-group.directive';
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
  CatalogoItem,
  esOrdenamientoValido,
  esCalificacionValida,
  LONGITUD_MAXIMA_BUSQUEDA,
  LONGITUD_MINIMA_BUSQUEDA,
  OrdenamientoAuditores,
  PaginaAuditores,
} from './auditor.model';

const TOTAL_ESTRELLAS = 5;
const MENSAJE_ERROR_DIRECTORIO =
  'No se pudo cargar el directorio de auditores. Intente nuevamente.';
const MENSAJE_ERROR_FILTRO = 'No se pudo aplicar el filtro. Intente nuevamente.';

interface FiltrosDirectorioModel {
  terminoBusqueda: string;
  especialidades: string[];
  zona: string | null;
  calificacionMinima: number | null;
  soloDisponibles: boolean;
  ordenamiento: OrdenamientoAuditores;
  pagina: number;
}

const FILTROS_INICIALES: FiltrosDirectorioModel = {
  terminoBusqueda: '',
  especialidades: [],
  zona: null,
  calificacionMinima: null,
  soloDisponibles: false,
  ordenamiento: 'CALIFICACION',
  pagina: 0,
};

interface ChipFiltro {
  tipo: 'especialidad' | 'zona' | 'calificacion' | 'disponible';
  valor: string;
  etiqueta: string;
}

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
    CheckboxComponent,
    RadioComponent,
    RadioGroupDirective,
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

  protected readonly modelo = signal<FiltrosDirectorioModel>(FILTROS_INICIALES);
  private readonly recarga = signal(0);

  protected readonly especialidadesCatalogo = signal<CatalogoItem[]>([]);
  protected readonly zonasCatalogo = signal<CatalogoItem[]>([]);
  protected readonly especialidadesCargando = signal(true);
  protected readonly zonasCargando = signal(true);
  protected readonly especialidadesDeshabilitadas = signal(false);
  protected readonly zonasDeshabilitadas = signal(false);

  protected readonly resultado = signal<PaginaAuditores | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);

  protected readonly ordenOpciones: SelectOption[] = [
    { value: 'CALIFICACION', label: 'Calificación' },
    { value: 'AUDITORIAS_COMPLETADAS', label: 'Auditorías completadas' },
    { value: 'TIEMPO_RESPUESTA', label: 'Tiempo de respuesta' },
  ];

  protected readonly calificacionOpciones: SelectOption[] = [
    { value: '', label: 'Cualquiera' },
    { value: '3', label: '3+ estrellas' },
    { value: '4', label: '4+ estrellas' },
    { value: '5', label: '5 estrellas' },
  ];

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'AUDITORES',
    pageTitle: 'Directorio de Auditores',
    showNotificationDot: true,
    userInitials: this.authSession.getUserInitials(),
  }));

  protected readonly avisoBusqueda = computed(() =>
    this.modelo().terminoBusqueda.trim().length === 1
      ? 'Ingrese al menos 2 caracteres para buscar.'
      : ''
  );

  protected readonly calificacionValor = computed(() => {
    const valor = this.modelo().calificacionMinima;
    return valor === null ? '' : String(valor);
  });

  private readonly etiquetasEspecialidad = computed(
    () => new Map(this.especialidadesCatalogo().map((item) => [item.valor, item.etiqueta]))
  );

  private readonly etiquetasZona = computed(
    () => new Map(this.zonasCatalogo().map((item) => [item.valor, item.etiqueta]))
  );

  protected readonly chipsActivos = computed<ChipFiltro[]>(() => {
    const modelo = this.modelo();
    const chips: ChipFiltro[] = modelo.especialidades.map((valor) => ({
      tipo: 'especialidad' as const,
      valor,
      etiqueta: this.etiquetasEspecialidad().get(valor) ?? valor,
    }));
    if (modelo.zona) {
      chips.push({
        tipo: 'zona',
        valor: modelo.zona,
        etiqueta: this.etiquetasZona().get(modelo.zona) ?? modelo.zona,
      });
    }
    if (modelo.calificacionMinima !== null) {
      chips.push({
        tipo: 'calificacion',
        valor: String(modelo.calificacionMinima),
        etiqueta: `${modelo.calificacionMinima}+ estrellas`,
      });
    }
    if (modelo.soloDisponibles) {
      chips.push({ tipo: 'disponible', valor: 'true', etiqueta: 'Solo disponibles' });
    }
    return chips;
  });

  protected readonly hayFiltrosActivos = computed(() => this.chipsActivos().length > 0);

  protected readonly mensajeError = computed(() =>
    this.hayFiltrosActivos() ? MENSAJE_ERROR_FILTRO : MENSAJE_ERROR_DIRECTORIO
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

  private readonly criterios = computed(() => {
    const modelo = this.modelo();
    return {
      termino: this.terminoNormalizado(modelo.terminoBusqueda),
      especialidades: modelo.especialidades,
      zona: modelo.zona,
      calificacion: modelo.calificacionMinima,
      disponibles: modelo.soloDisponibles,
      orden: modelo.ordenamiento,
      pagina: modelo.pagina,
      recarga: this.recarga(),
    };
  });

  constructor() {
    void this.cargarCatalogos();
    this.iniciarBusquedaReactiva();
  }

  protected onBuscar(valor: string): void {
    this.modelo.update((modelo) => ({ ...modelo, terminoBusqueda: valor, pagina: 0 }));
  }

  protected onOrdenar(valor: string): void {
    if (!esOrdenamientoValido(valor)) {
      return;
    }
    this.modelo.update((modelo) => ({
      ...modelo,
      ordenamiento: valor,
      pagina: 0,
    }));
  }

  protected toggleEspecialidad(valor: string, activa: boolean): void {
    this.modelo.update((modelo) => ({
      ...modelo,
      especialidades: activa
        ? [...modelo.especialidades, valor]
        : modelo.especialidades.filter((item) => item !== valor),
      pagina: 0,
    }));
  }

  protected onZona(valor: string | null): void {
    this.modelo.update((modelo) => ({
      ...modelo,
      zona: valor === '' ? null : valor,
      pagina: 0,
    }));
  }

  protected onCalificacion(valor: string): void {
    if (!esCalificacionValida(valor)) {
      return;
    }
    this.modelo.update((modelo) => ({
      ...modelo,
      calificacionMinima: valor === '' ? null : Number(valor),
      pagina: 0,
    }));
  }

  protected onSoloDisponibles(valor: boolean): void {
    this.modelo.update((modelo) => ({ ...modelo, soloDisponibles: valor, pagina: 0 }));
  }

  protected estaEspecialidad(valor: string): boolean {
    return this.modelo().especialidades.includes(valor);
  }

  protected quitarFiltro(chip: ChipFiltro): void {
    switch (chip.tipo) {
      case 'especialidad':
        this.toggleEspecialidad(chip.valor, false);
        break;
      case 'zona':
        this.onZona(null);
        break;
      case 'calificacion':
        this.onCalificacion('');
        break;
      case 'disponible':
        this.onSoloDisponibles(false);
        break;
    }
  }

  protected limpiarFiltros(): void {
    this.modelo.update((modelo) => ({
      ...FILTROS_INICIALES,
      terminoBusqueda: modelo.terminoBusqueda,
      ordenamiento: modelo.ordenamiento,
    }));
  }

  protected irAPagina(numeroPagina: number): void {
    this.modelo.update((modelo) => ({ ...modelo, pagina: numeroPagina }));
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
            a.especialidades.join(',') === b.especialidades.join(',') &&
            a.zona === b.zona &&
            a.calificacion === b.calificacion &&
            a.disponibles === b.disponibles &&
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
              especialidades: criterio.especialidades,
              zonaGeografica: criterio.zona,
              calificacionMinima: criterio.calificacion,
              soloDisponibles: criterio.disponibles,
              pagina: criterio.pagina,
              ordenamiento: criterio.orden,
            })
            .pipe(
              catchError((err: unknown) => {
                this.error.set(true);
                this.toastService.error(
                  apiErrorMessage(err) ?? this.mensajeError(),
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

  private async cargarCatalogos(): Promise<void> {
    await Promise.all([this.cargarEspecialidades(), this.cargarZonas()]);
  }

  private async cargarEspecialidades(): Promise<void> {
    try {
      this.especialidadesCatalogo.set(
        await firstValueFrom(this.auditoresService.obtenerEspecialidades())
      );
    } catch (err: unknown) {
      this.especialidadesDeshabilitadas.set(true);
      this.toastService.error(
        apiErrorMessage(err) ??
          'No se pudo cargar el catálogo de especialidades. Los demás filtros están disponibles.',
        undefined,
        5000
      );
    } finally {
      this.especialidadesCargando.set(false);
    }
  }

  private async cargarZonas(): Promise<void> {
    try {
      this.zonasCatalogo.set(await firstValueFrom(this.auditoresService.obtenerZonas()));
    } catch (err: unknown) {
      this.zonasDeshabilitadas.set(true);
      this.toastService.error(
        apiErrorMessage(err) ??
          'No se pudo cargar el catálogo de zonas. Los demás filtros están disponibles.',
        undefined,
        5000
      );
    } finally {
      this.zonasCargando.set(false);
    }
  }

  private terminoNormalizado(terminoBusqueda: string): string {
    const termino = terminoBusqueda.trim();
    if (termino.length < LONGITUD_MINIMA_BUSQUEDA || termino.length > LONGITUD_MAXIMA_BUSQUEDA) {
      return '';
    }
    return termino;
  }

  private tarjeta(auditor: AuditorResumen): TarjetaAuditor {
    const redondeada =
      auditor.calificacionPromedio === null ? 0 : Math.round(auditor.calificacionPromedio);
    const provincia = auditor.provincia
      ? (this.etiquetasZona().get(auditor.provincia) ?? auditor.provincia)
      : null;
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
        (clave) => this.etiquetasEspecialidad().get(clave) ?? clave
      ),
    };
  }
}
