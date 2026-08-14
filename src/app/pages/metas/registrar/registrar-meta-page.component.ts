import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  minDate,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateInputComponent } from '../../../shared/components/inputs/date-input/date-input.component';
import { NumberInputComponent } from '../../../shared/components/inputs/number-input/number-input.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { todayUtcMidnight, toIsoDateString } from '../../../shared/utils/date.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { CrearMetaRequest, MetaReduccion } from '../metas.model';
import { MetasService } from '../metas.service';

const MENSAJE_NOMBRE = 'El nombre de la meta debe tener entre 3 y 100 caracteres.';
const MENSAJE_VALOR = 'Ingresa un valor numérico positivo.';
const MENSAJE_FECHA = 'La fecha límite debe ser una fecha futura.';
const ERROR_GENERICO = 'No se pudo registrar la meta. Intenta nuevamente.';
const ERROR_ACTUALIZAR = 'No se pudo actualizar la meta. Intenta nuevamente.';
const ERROR_ELIMINAR = 'No se pudo eliminar la meta. Intenta nuevamente.';
const DURACION_TOAST_MS = 5000;

interface RegistrarMetaFormModel {
  nombreMeta: string;
  valorObjetivoHuellaT: number | null;
  fechaLimite: Date | null;
}

/**
 * Alta y gestión de metas de reducción (PP-78). A esta pantalla redirige el
 * botón "Agregar meta" del módulo del dashboard cuando la empresa no tiene
 * metas registradas, y el enlace "Gestionar metas" cuando sí las tiene —
 * por eso combina el formulario de alta con el listado y las acciones de
 * editar/eliminar, en vez de vivir en pantallas separadas.
 */
@Component({
  selector: 'app-registrar-meta-page',
  imports: [
    ButtonComponent,
    DateInputComponent,
    DatePipe,
    FormField,
    HeadingComponent,
    IconComponent,
    NumberInputComponent,
    ShellLayoutComponent,
    TextInputComponent,
  ],
  templateUrl: './registrar-meta-page.component.html',
  styleUrl: './registrar-meta-page.component.scss',
})
export class RegistrarMetaPageComponent {
  private readonly metasService = inject(MetasService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly hoy = todayUtcMidnight();
  protected readonly enviando = signal(false);

  protected readonly metas = signal<MetaReduccion[]>([]);
  protected readonly loadingList = signal(false);
  protected readonly editingMetaId = signal<string | null>(null);
  protected readonly confirmDeleteId = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly isEditing = computed(() => this.editingMetaId() !== null);

  protected readonly model = signal<RegistrarMetaFormModel>({
    nombreMeta: '',
    valorObjetivoHuellaT: null,
    fechaLimite: null,
  });

  protected readonly metaForm = form(
    this.model,
    schema<RegistrarMetaFormModel>((path) => {
      required(path.nombreMeta, { message: MENSAJE_NOMBRE });
      validate(path.nombreMeta, ({ value }) => {
        const longitud = value().trim().length;
        if (longitud === 0) return undefined; // ya cubierto por required()
        if (longitud < 3 || longitud > 100) {
          return { kind: 'nombreLongitud', message: MENSAJE_NOMBRE };
        }
        return undefined;
      });

      required(path.valorObjetivoHuellaT, { message: MENSAJE_VALOR });
      validate(path.valorObjetivoHuellaT, ({ value }) => {
        const valor = value();
        if (valor === null) return undefined; // ya cubierto por required()
        if (!Number.isFinite(valor) || valor <= 0) {
          return { kind: 'valorPositivo', message: MENSAJE_VALOR };
        }
        return undefined;
      });

      required(path.fechaLimite, { message: MENSAJE_FECHA });
      minDate(path.fechaLimite, this.hoy, { message: MENSAJE_FECHA });

      disabled(path.nombreMeta, { when: () => this.enviando() });
      disabled(path.valorObjetivoHuellaT, { when: () => this.enviando() });
      disabled(path.fechaLimite, { when: () => this.enviando() });
    })
  );

  protected readonly nombreMetaError = computed(() => fieldError(this.metaForm.nombreMeta()));
  protected readonly valorObjetivoError = computed(() =>
    fieldError(this.metaForm.valorObjetivoHuellaT())
  );
  protected readonly fechaLimiteError = computed(() => fieldError(this.metaForm.fechaLimite()));

  protected readonly puedeEnviar = computed(() => this.metaForm().valid() && !this.enviando());

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Metas de reducción',
    showBackButton: true,
  };

  constructor() {
    this.cargarMetas();
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.guardar();
  }

  protected cargarMetas(): void {
    this.loadingList.set(true);
    firstValueFrom(this.metasService.listarMetas())
      .then((metas) => this.metas.set(metas))
      .catch(() => this.toastService.error('No se pudieron cargar las metas registradas.'))
      .finally(() => this.loadingList.set(false));
  }

  protected editar(meta: MetaReduccion): void {
    this.editingMetaId.set(meta.id);
    this.confirmDeleteId.set(null);
    this.model.set({
      nombreMeta: meta.nombreMeta,
      valorObjetivoHuellaT: meta.valorObjetivoHuellaT,
      fechaLimite: new Date(meta.fechaLimite),
    });
  }

  protected cancelarEdicion(): void {
    this.editingMetaId.set(null);
    this.model.set({ nombreMeta: '', valorObjetivoHuellaT: null, fechaLimite: null });
  }

  protected solicitarEliminar(id: string): void {
    this.confirmDeleteId.set(id);
  }

  protected cancelarEliminar(): void {
    this.confirmDeleteId.set(null);
  }

  protected eliminar(id: string): void {
    if (this.deletingId() !== null) return;

    this.deletingId.set(id);
    this.metasService.eliminarMeta(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
        this.toastService.success('Meta eliminada.');
        if (this.editingMetaId() === id) {
          this.cancelarEdicion();
        }
        this.cargarMetas();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
        if (error.status === 404) {
          this.toastService.error(
            apiErrorMessage(error) ?? 'Esa meta ya no existe. Recargando el listado.'
          );
          this.cargarMetas();
          return;
        }
        this.toastService.error(apiErrorMessage(error) ?? ERROR_ELIMINAR);
      },
    });
  }

  protected barraAncho(meta: MetaReduccion): number {
    return Math.min(Math.max(meta.progresoPorcentaje, 0), 100);
  }

  private async guardar(): Promise<void> {
    await submit(this.metaForm, {
      action: async (field) => {
        const value = field().value();
        if (value.valorObjetivoHuellaT === null || value.fechaLimite === null) return undefined;

        const request: CrearMetaRequest = {
          nombreMeta: value.nombreMeta.trim(),
          valorObjetivoHuellaT: value.valorObjetivoHuellaT,
          fechaLimite: toIsoDateString(value.fechaLimite),
        };

        const editingId = this.editingMetaId();
        this.enviando.set(true);
        try {
          if (editingId !== null) {
            await firstValueFrom(this.metasService.actualizarMeta(editingId, request));
            this.toastService.success('Meta actualizada.', undefined, DURACION_TOAST_MS);
            this.cancelarEdicion();
            this.cargarMetas();
          } else {
            await firstValueFrom(this.metasService.crearMeta(request));
            this.toastService.success(
              'Meta de reducción registrada.',
              undefined,
              DURACION_TOAST_MS
            );
            await this.router.navigateByUrl('/empresa/certificaciones');
          }
        } catch (err: unknown) {
          const mensajePorDefecto = editingId !== null ? ERROR_ACTUALIZAR : ERROR_GENERICO;
          this.toastService.error(
            apiErrorMessage(err) ?? mensajePorDefecto,
            undefined,
            DURACION_TOAST_MS
          );
        } finally {
          this.enviando.set(false);
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }
}
