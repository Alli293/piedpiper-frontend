import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import {
  disabled,
  form,
  FormField,
  maxLength,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import {
  CalificacionResponse,
  CrearCalificacionRequest,
  EditarCalificacionRequest,
} from '../../../../core/calificacion/calificacion.models';
import { CalificacionService } from '../../../../core/calificacion/calificacion.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { StarRatingComponent } from '../../../../shared/components/star-rating/star-rating.component';
import { TextareaComponent } from '../../../../shared/components/inputs/textarea/textarea.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { fieldError } from '../../../../shared/utils/form-field.utils';

const DURACION_TOAST_MS = 5000;
const MAXIMO_CARACTERES_COMENTARIO = 500;

const MSG_CREACION_EXITOSA = 'Calificación guardada correctamente.';
const MSG_EDICION_EXITOSA = 'Calificación actualizada correctamente.';
const MSG_ERROR_PERMISO = 'No es posible calificar esta auditoría.';
const MSG_ERROR_NO_ENCONTRADA = 'La calificación que intenta editar no existe.';
const MSG_ERROR_GENERICO = 'No se pudo guardar la calificación. Intente nuevamente.';

interface CalificacionFormModel {
  calificacion: number | null;
  comentario: string;
}

@Component({
  selector: 'app-calificacion-form',
  standalone: true,
  imports: [FormField, ButtonComponent, StarRatingComponent, TextareaComponent],
  templateUrl: './calificacion-form.component.html',
  styleUrl: './calificacion-form.component.scss',
})
export class CalificacionFormComponent {
  private readonly calificacionService = inject(CalificacionService);
  private readonly toastService = inject(ToastService);

  /** ID de la auditoría asociada. */
  auditoriaId = input.required<string>();

  /** ID del auditor que se está calificando. */
  auditorId = input.required<string>();

  /** Si existe, el componente inicia en modo edición con estos valores precargados. */
  calificacionExistente = input<CalificacionResponse | null>(null);

  /** Estado actual de la auditoría. Controla si la opción de calificar es visible. */
  estadoAuditoria = input<string>('');

  /** ID de la empresa del usuario autenticado. Controla visibilidad del botón de edición. */
  empresaIdUsuario = input<string>('');

  protected readonly guardando = signal(false);
  protected readonly cargando = signal(false);
  protected readonly editando = signal(false);
  protected readonly maximoCaracteresComentario = MAXIMO_CARACTERES_COMENTARIO;

  /** ID de la calificación para modo edición. */
  private calificacionId = signal<string | null>(null);

  /** Calificación actualizada tras guardar (sobreescribe el input). */
  private calificacionGuardada = signal<CalificacionResponse | null>(null);

  /** Calificación actual: usa la guardada si existe, sino el input. */
  protected readonly calificacionActual = computed(
    () => this.calificacionGuardada() ?? this.calificacionExistente()
  );

  protected readonly modoEdicion = computed(
    () => this.calificacionActual() !== null || this.calificacionId() !== null
  );

  /** Solo permite calificar cuando la auditoría está en estado CERTIFICACION_EMITIDA. */
  protected readonly puedeCalificar = computed(
    () => this.estadoAuditoria() === 'CERTIFICACION_EMITIDA'
  );

  /** Permite editar solo calificaciones que pertenecen a la empresa del usuario autenticado. */
  protected readonly puedeEditar = computed(() => {
    const existente = this.calificacionActual();
    const empresaUsuario = this.empresaIdUsuario();
    return existente !== null && empresaUsuario !== '' && existente.empresaId === empresaUsuario;
  });

  protected readonly model = signal<CalificacionFormModel>({
    calificacion: null,
    comentario: '',
  });

  protected readonly calificacionForm = form(
    this.model,
    schema<CalificacionFormModel>((path) => {
      validate(path.calificacion, (ctx) => {
        const valor = ctx.value();
        if (valor === null) {
          return { kind: 'required', message: 'Seleccione una calificación.' };
        }
        if (valor < 1 || valor > 5) {
          return {
            kind: 'rango',
            message: 'La calificación debe ser un valor entre 1 y 5.',
          };
        }
        return undefined;
      });

      maxLength(path.comentario, MAXIMO_CARACTERES_COMENTARIO, {
        message: 'El comentario no puede superar los 500 caracteres.',
      });

      disabled(path.calificacion, { when: () => this.guardando() || this.cargando() });
      disabled(path.comentario, { when: () => this.guardando() || this.cargando() });
    })
  );

  protected readonly calificacionError = computed(() =>
    fieldError(this.calificacionForm.calificacion())
  );

  protected readonly comentarioError = computed(() =>
    fieldError(this.calificacionForm.comentario())
  );

  protected readonly caracteresComentario = computed(() => this.model().comentario.length);

  protected readonly puedeGuardar = computed(
    () => this.calificacionForm().valid() && !this.guardando() && !this.cargando()
  );

  constructor() {
    effect(() => {
      const existente = this.calificacionExistente();
      if (existente) {
        this.precargarDatos(existente);
      }
    });
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.guardar();
  }

  protected onCalificacionChange(valor: number | null): void {
    this.model.update((m) => ({ ...m, calificacion: valor }));
  }

  /** Transiciona a modo edición cuando el usuario hace clic en el botón Editar. */
  protected iniciarEdicion(): void {
    const existente = this.calificacionActual();
    if (existente) {
      this.precargarDatos(existente);
      this.editando.set(true);
    }
  }

  private precargarDatos(calificacion: CalificacionResponse): void {
    this.calificacionId.set(calificacion.id);
    this.model.set({
      calificacion: calificacion.calificacion,
      comentario: calificacion.comentario ?? '',
    });
  }

  private async guardar(): Promise<void> {
    await submit(this.calificacionForm, {
      action: async (field) => {
        const value = field().value();
        if (value.calificacion === null) return undefined;

        this.guardando.set(true);
        try {
          if (this.modoEdicion()) {
            await this.editarCalificacion(value);
          } else {
            await this.crearCalificacion(value);
          }
        } catch (err: unknown) {
          this.manejarError(err);
        } finally {
          this.guardando.set(false);
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  private async crearCalificacion(value: CalificacionFormModel): Promise<void> {
    const payload: CrearCalificacionRequest = {
      auditoriaId: this.auditoriaId(),
      calificacion: value.calificacion!,
      comentario: value.comentario.trim() || undefined,
    };

    const resultado = await firstValueFrom(this.calificacionService.crearCalificacion(payload));
    this.calificacionId.set(resultado.id);
    this.toastService.success(MSG_CREACION_EXITOSA, undefined, DURACION_TOAST_MS);
  }

  private async editarCalificacion(value: CalificacionFormModel): Promise<void> {
    const id = this.calificacionId()!;
    const payload: EditarCalificacionRequest = {
      calificacion: value.calificacion!,
      comentario: value.comentario.trim() || undefined,
    };

    const resultado = await firstValueFrom(this.calificacionService.editarCalificacion(id, payload));
    this.calificacionGuardada.set(resultado);
    this.editando.set(false);
    this.toastService.success(MSG_EDICION_EXITOSA, undefined, DURACION_TOAST_MS);

    // Recargar la página para reflejar el promedio actualizado
    setTimeout(() => window.location.reload(), 1500);
  }

  private manejarError(err: unknown): void {
    if (!(err instanceof HttpErrorResponse)) {
      this.toastService.error(MSG_ERROR_GENERICO, undefined, DURACION_TOAST_MS);
      return;
    }

    switch (err.status) {
      case 403:
      case 422:
        this.toastService.error(MSG_ERROR_PERMISO, undefined, DURACION_TOAST_MS);
        break;
      case 404:
        this.toastService.error(MSG_ERROR_NO_ENCONTRADA, undefined, DURACION_TOAST_MS);
        break;
      case 409:
        this.transicionarAModoEdicion(err);
        break;
      default:
        this.toastService.error(MSG_ERROR_GENERICO, undefined, DURACION_TOAST_MS);
        break;
    }
  }

  /** Transición automática a modo edición cuando el backend responde 409. */
  private transicionarAModoEdicion(err: HttpErrorResponse): void {
    const body = err.error as CalificacionResponse | undefined;
    if (body?.id) {
      this.precargarDatos(body);
    }
  }
}
