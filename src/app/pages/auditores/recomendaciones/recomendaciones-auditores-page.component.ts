import { Component, computed, inject, signal } from '@angular/core';
import { disabled, form, FormField, schema, submit, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../../shared/components/inputs/select-input/select-input.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { AuditoresService } from '../auditores.service';
import { AuditorRecomendado, CatalogoItem } from '../auditor.model';

const ERROR_RECOMENDACIONES = 'No se pudieron cargar las recomendaciones. Intente nuevamente.';
const ERROR_CATALOGOS = 'No se pudieron cargar los catálogos. Intente nuevamente.';
const CAMPO_OBLIGATORIO = 'Este campo es obligatorio.';

interface RecomendacionFormModel {
  tipoAuditoria: string;
  especialidadBuscada: string;
  zonaGeografica: string;
  soloDisponibles: boolean;
}

@Component({
  selector: 'app-recomendaciones-auditores-page',
  imports: [
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    CheckboxComponent,
    FormField,
    HeadingComponent,
    SelectInputComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './recomendaciones-auditores-page.component.html',
  styleUrl: './recomendaciones-auditores-page.component.scss',
})
export class RecomendacionesAuditoresPageComponent {
  private readonly auditoresService = inject(AuditoresService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly especialidades = signal<CatalogoItem[]>([]);
  protected readonly zonas = signal<CatalogoItem[]>([]);

  protected readonly recomendaciones = signal<AuditorRecomendado[]>([]);
  protected readonly iaDisponible = signal(true);

  /**
   * Distingue "todavía no buscaste" de "buscaste y no hubo nadie". Sin esto, la pantalla mostraría
   * el mensaje de sin resultados nada más entrar, antes de que el usuario pida nada.
   */
  protected readonly hayBusqueda = signal(false);

  protected readonly model = signal<RecomendacionFormModel>({
    tipoAuditoria: '',
    especialidadBuscada: '',
    zonaGeografica: '',
    soloDisponibles: true,
  });

  protected readonly recomendacionForm = form(
    this.model,
    schema<RecomendacionFormModel>((path) => {
      validate(path.tipoAuditoria, ({ value }) => obligatorio(value()));
      validate(path.especialidadBuscada, ({ value }) => obligatorio(value()));
      validate(path.zonaGeografica, ({ value }) => obligatorio(value()));

      disabled(path.tipoAuditoria, { when: () => this.cargando() });
      disabled(path.especialidadBuscada, { when: () => this.cargando() });
      disabled(path.zonaGeografica, { when: () => this.cargando() });
      disabled(path.soloDisponibles, { when: () => this.cargando() });
    })
  );

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'Auditores',
    pageTitle: 'Recomendaciones',
    showNotificationDot: false,
    showBackButton: true,
  };

  protected readonly tipoAuditoriaError = computed(() =>
    fieldError(this.recomendacionForm.tipoAuditoria())
  );
  protected readonly especialidadError = computed(() =>
    fieldError(this.recomendacionForm.especialidadBuscada())
  );
  protected readonly zonaError = computed(() =>
    fieldError(this.recomendacionForm.zonaGeografica())
  );

  protected readonly opcionesEspecialidad = computed<SelectOption[]>(() =>
    this.especialidades().map((item) => ({ value: item.valor, label: item.etiqueta }))
  );

  protected readonly opcionesZona = computed<SelectOption[]>(() =>
    this.zonas().map((item) => ({ value: item.valor, label: item.etiqueta }))
  );

  protected readonly sinResultados = computed(
    () => this.hayBusqueda() && !this.cargando() && this.recomendaciones().length === 0
  );

  protected readonly avisoIaNoDisponible = computed(
    () => this.hayBusqueda() && !this.iaDisponible() && this.recomendaciones().length > 0
  );

  constructor() {
    void this.cargarCatalogos();
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.buscar();
  }

  protected verPerfil(auditorId: string): void {
    void this.router.navigateByUrl(`/auditores/${auditorId}`);
  }

  protected explorarDirectorio(): void {
    void this.router.navigateByUrl('/auditores');
  }

  private async cargarCatalogos(): Promise<void> {
    try {
      const [especialidades, zonas] = await Promise.all([
        firstValueFrom(this.auditoresService.obtenerEspecialidades()),
        firstValueFrom(this.auditoresService.obtenerZonas()),
      ]);
      this.especialidades.set(especialidades);
      this.zonas.set(zonas);
    } catch (err: unknown) {
      this.error.set(apiErrorMessage(err) ?? ERROR_CATALOGOS);
    }
  }

  private async buscar(): Promise<void> {
    await submit(this.recomendacionForm, {
      action: async (field) => {
        const valores = field().value();
        this.cargando.set(true);
        this.error.set(null);
        try {
          const respuesta = await firstValueFrom(
            this.auditoresService.recomendar({
              tipoAuditoria: valores.tipoAuditoria,
              especialidadBuscada: valores.especialidadBuscada,
              zonaGeografica: valores.zonaGeografica,
              soloDisponibles: valores.soloDisponibles,
            })
          );
          this.recomendaciones.set(respuesta.recomendaciones);
          this.iaDisponible.set(respuesta.iaDisponible);
          this.hayBusqueda.set(true);
        } catch (err: unknown) {
          // Un fallo del servidor no deja en pantalla las tarjetas de la búsqueda anterior.
          this.recomendaciones.set([]);
          this.hayBusqueda.set(false);
          this.error.set(apiErrorMessage(err) ?? ERROR_RECOMENDACIONES);
        } finally {
          this.cargando.set(false);
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }
}

function obligatorio(valor: string) {
  return valor.trim() === ''
    ? { kind: 'requerido' as const, message: CAMPO_OBLIGATORIO }
    : undefined;
}
