import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CheckboxComponent } from '../../shared/components/inputs/checkbox/checkbox.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { AuditoresService } from './auditores.service';
import {
  AuditorResumen,
  CatalogoItem,
  OrdenamientoAuditores,
  PaginaAuditores,
} from './auditor.model';

const TOTAL_ESTRELLAS = 5;

interface ChipFiltro {
  tipo: 'especialidad' | 'zona' | 'calificacion' | 'disponible';
  valor: string;
  etiqueta: string;
}

@Component({
  selector: 'app-directorio-auditores-page',
  imports: [
    RouterLink,
    ShellLayoutComponent,
    TextInputComponent,
    SelectInputComponent,
    CheckboxComponent,
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

  protected readonly especialidadesSeleccionadas = signal<string[]>([]);
  protected readonly zonaSeleccionada = signal<string | null>(null);
  protected readonly calificacionMinima = signal<number | null>(null);
  protected readonly soloDisponibles = signal(false);

  protected readonly especialidadesCatalogo = signal<CatalogoItem[]>([]);
  protected readonly zonasCatalogo = signal<CatalogoItem[]>([]);
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
    this.terminoBusqueda().trim().length === 1 ? 'Ingrese al menos 2 caracteres para buscar.' : ''
  );

  protected readonly calificacionValor = computed(() => {
    const valor = this.calificacionMinima();
    return valor === null ? '' : String(valor);
  });

  protected readonly chipsActivos = computed<ChipFiltro[]>(() => {
    const chips: ChipFiltro[] = this.especialidadesSeleccionadas().map((valor) => ({
      tipo: 'especialidad',
      valor,
      etiqueta: this.etiquetaEspecialidad(valor),
    }));
    const zona = this.zonaSeleccionada();
    if (zona) {
      chips.push({ tipo: 'zona', valor: zona, etiqueta: this.etiquetaZona(zona) });
    }
    const calificacion = this.calificacionMinima();
    if (calificacion !== null) {
      chips.push({
        tipo: 'calificacion',
        valor: String(calificacion),
        etiqueta: `${calificacion}+ estrellas`,
      });
    }
    if (this.soloDisponibles()) {
      chips.push({ tipo: 'disponible', valor: 'true', etiqueta: 'Solo disponibles' });
    }
    return chips;
  });

  protected readonly hayFiltrosActivos = computed(() => this.chipsActivos().length > 0);

  protected readonly sinResultados = computed(
    () => !this.cargando() && !this.error() && this.resultado()?.contenido.length === 0
  );

  private readonly criterios = computed(() => ({
    termino: this.terminoBusqueda().trim(),
    especialidades: this.especialidadesSeleccionadas(),
    zona: this.zonaSeleccionada(),
    calificacion: this.calificacionMinima(),
    disponibles: this.soloDisponibles(),
    orden: this.ordenamiento(),
    pagina: this.pagina(),
    recarga: this.recarga(),
  }));

  constructor() {
    this.cargarCatalogos();
    toObservable(this.criterios)
      .pipe(
        debounceTime(250),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
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

  protected onBuscar(valor: string): void {
    this.terminoBusqueda.set(valor);
    this.pagina.set(0);
  }

  protected onOrdenar(valor: string): void {
    this.ordenamiento.set(valor as OrdenamientoAuditores);
    this.pagina.set(0);
  }

  protected toggleEspecialidad(valor: string, activa: boolean): void {
    this.especialidadesSeleccionadas.update((actuales) =>
      activa ? [...actuales, valor] : actuales.filter((item) => item !== valor)
    );
    this.pagina.set(0);
  }

  protected toggleZona(valor: string, activa: boolean): void {
    this.zonaSeleccionada.set(activa ? valor : null);
    this.pagina.set(0);
  }

  protected onCalificacion(valor: string): void {
    this.calificacionMinima.set(valor === '' ? null : Number(valor));
    this.pagina.set(0);
  }

  protected onSoloDisponibles(valor: boolean): void {
    this.soloDisponibles.set(valor);
    this.pagina.set(0);
  }

  protected estaEspecialidad(valor: string): boolean {
    return this.especialidadesSeleccionadas().includes(valor);
  }

  protected quitarFiltro(chip: ChipFiltro): void {
    switch (chip.tipo) {
      case 'especialidad':
        this.toggleEspecialidad(chip.valor, false);
        break;
      case 'zona':
        this.zonaSeleccionada.set(null);
        break;
      case 'calificacion':
        this.calificacionMinima.set(null);
        break;
      case 'disponible':
        this.soloDisponibles.set(false);
        break;
    }
    this.pagina.set(0);
  }

  protected limpiarFiltros(): void {
    this.especialidadesSeleccionadas.set([]);
    this.zonaSeleccionada.set(null);
    this.calificacionMinima.set(null);
    this.soloDisponibles.set(false);
    this.pagina.set(0);
  }

  protected irAPagina(numeroPagina: number): void {
    this.pagina.set(numeroPagina);
  }

  protected reintentar(): void {
    this.recarga.update((valor) => valor + 1);
  }

  protected paginas(): number[] {
    const total = this.resultado()?.totalPaginas ?? 0;
    return Array.from({ length: total }, (_, indice) => indice);
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter((parte) => parte.length > 0)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected estrellas(calificacion: number | null): boolean[] {
    const redondeada = calificacion === null ? 0 : Math.round(calificacion);
    return Array.from({ length: TOTAL_ESTRELLAS }, (_, indice) => indice < redondeada);
  }

  protected etiquetaEspecialidad(valor: string): string {
    return this.especialidadesCatalogo().find((item) => item.valor === valor)?.etiqueta ?? valor;
  }

  protected etiquetaZona(valor: string): string {
    return this.zonasCatalogo().find((item) => item.valor === valor)?.etiqueta ?? valor;
  }

  protected ubicacion(auditor: AuditorResumen): string {
    const provincia = auditor.provincia ? this.etiquetaZona(auditor.provincia) : null;
    const experiencia =
      auditor.aniosExperiencia !== null ? `${auditor.aniosExperiencia} años exp.` : null;
    return [provincia, experiencia].filter((parte): parte is string => parte !== null).join(' · ');
  }

  private cargarCatalogos(): void {
    this.auditoresService
      .obtenerEspecialidades()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalogo) => this.especialidadesCatalogo.set(catalogo),
        error: () => {
          this.especialidadesDeshabilitadas.set(true);
          this.toastService.error(
            'No se pudo cargar el catálogo de especialidades. Los demás filtros están disponibles.',
            undefined,
            5000
          );
        },
      });

    this.auditoresService
      .obtenerZonas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalogo) => this.zonasCatalogo.set(catalogo),
        error: () => {
          this.zonasDeshabilitadas.set(true);
          this.toastService.error(
            'No se pudo cargar el catálogo de zonas. Los demás filtros están disponibles.',
            undefined,
            5000
          );
        },
      });
  }
}
