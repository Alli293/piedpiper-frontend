import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  disabled,
  form,
  FormField,
  maxLength,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { AlternativasComparacionComponent } from '../alternativas-comparacion/alternativas-comparacion.component';
import { EcoRutaAlternativasService } from '../ecoruta-alternativas.service';
import { EcoRutaItinerariosService } from '../ecoruta-itinerarios.service';
import {
  AlternativaDTO,
  ComparacionResponse,
  SustitucionRequest,
} from '../models/alternativas.model';
import { Itinerario, ItinerarioActividad } from '../models/itinerario.model';
import { MensajeConversacion, RefinamientoRequest } from '../models/refinamiento.model';

/** Frases de ejemplo tomadas del propio criterio de aceptación de PP-88, como atajos para el usuario. */
const CHIPS_SUGERIDOS: readonly string[] = [
  'Quiero más actividades al aire libre.',
  'Busca opciones más económicas.',
  'Prefiero lugares cerca de San José.',
];

/** Mismo tope que el backend le exige a `mensajeUsuario` (RefinamientoItinerarioRequestDTO). */
const MENSAJE_MAX_LENGTH = 1000;

const ERROR_REFINAMIENTO = 'No fue posible actualizar el itinerario. Intenta nuevamente.';
const ERROR_ACCESO_DENEGADO = 'No tienes permiso para modificar este itinerario.';
const TOAST_DURATION_MS = 5000;

interface RefinamientoFormModel {
  mensaje: string;
}

@Component({
  selector: 'app-refinamiento-chat',
  imports: [IconComponent, AlternativasComparacionComponent, FormField],
  templateUrl: './refinamiento-chat.component.html',
  styleUrl: './refinamiento-chat.component.scss',
})
export class RefinamientoChatComponent {
  itinerario = input.required<Itinerario>();
  itinerarioActualizado = output<Itinerario>();

  private readonly alternativasService = inject(EcoRutaAlternativasService);
  private readonly itinerariosService = inject(EcoRutaItinerariosService);
  private readonly toastService = inject(ToastService);

  private readonly mensajeInputRef = viewChild<ElementRef<HTMLInputElement>>('mensajeInput');

  // State for alternativas comparison
  protected readonly comparacionResponse = signal<ComparacionResponse | null>(null);
  protected readonly cargandoAlternativas = signal<boolean>(false);
  protected readonly cargandoSustitucion = signal<boolean>(false);
  protected readonly actividadSeleccionadaId = signal<string | null>(null);

  // State for the free-text conversation itself (PP-88)
  protected readonly historial = signal<MensajeConversacion[]>([]);
  protected readonly enviandoMensaje = signal(false);
  protected readonly chipsSugeridos = CHIPS_SUGERIDOS;

  protected readonly model = signal<RefinamientoFormModel>({ mensaje: '' });
  protected readonly chatForm = form(
    this.model,
    schema<RefinamientoFormModel>((path) => {
      required(path.mensaje, { message: 'Escribí un mensaje para el asistente.' });
      maxLength(path.mensaje, MENSAJE_MAX_LENGTH, {
        message: `El mensaje no puede superar ${MENSAJE_MAX_LENGTH} caracteres.`,
      });
      disabled(path.mensaje, { when: () => this.enviandoMensaje() || this.cargandoSustitucion() });
    })
  );
  protected readonly canEnviar = computed(
    () => this.chatForm().valid() && !this.enviandoMensaje() && !this.cargandoSustitucion()
  );

  /**
   * Saludo inicial del chat. A propósito NO es un `computed()` sobre `itinerario()`: cada
   * refinamiento o sustitución exitosa hace que el padre vuelva a bajar un `itinerario` nuevo
   * (`itinerario.set($event)`), y un `computed` habría reescrito retroactivamente el primer
   * mensaje ya leído por el usuario (ej. "EcoScore de 82" pasando a "85" solo). Se captura una
   * sola vez, la primera vez que llega el itinerario.
   */
  protected readonly mensajeInicial = signal('');

  constructor() {
    effect(() => {
      const itinerario = this.itinerario();
      if (this.mensajeInicial()) return;
      const dias = itinerario.cantidadDias;
      const score = itinerario.ecoScore;
      const scoreTexto =
        score !== null && score !== undefined ? ` con un EcoScore de ${Math.round(score)}` : '';
      this.mensajeInicial.set(
        `Tu itinerario de ${dias} día${dias === 1 ? '' : 's'} está listo${scoreTexto}. ¿Querés ajustar algo?`
      );
    });
  }

  /** El mensaje de bienvenida siempre encabeza la conversación; el resto es el historial real. */
  protected readonly mensajesChat = computed<MensajeConversacion[]>(() => [
    { rol: 'ASISTENTE', contenido: this.mensajeInicial() },
    ...this.historial(),
  ]);

  protected readonly actividadOriginalInfo = computed(() => {
    const response = this.comparacionResponse();
    if (!response) return { nombre: '', ecoScore: 0 };
    return { nombre: response.actividadOriginalNombre, ecoScore: response.ecoScoreOriginal };
  });

  protected readonly actividades = computed(() => {
    const itinerario = this.itinerario();
    const todas: { actividad: ItinerarioActividad; diaNumero: number; actividadIndex: number }[] =
      [];
    for (const dia of itinerario.dias) {
      for (let i = 0; i < dia.actividades.length; i++) {
        todas.push({ actividad: dia.actividades[i], diaNumero: dia.numeroDia, actividadIndex: i });
      }
    }
    return todas;
  });

  /** Usado por el padre (botón "Preguntar sobre esto") para precargar el mensaje del chat. */
  prellenarMensaje(texto: string): void {
    this.model.update((m) => ({ ...m, mensaje: texto }));
    this.mensajeInputRef()?.nativeElement.focus();
  }

  protected seleccionarChip(texto: string): void {
    this.prellenarMensaje(texto);
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private async onSubmit(): Promise<void> {
    await submit(this.chatForm, {
      action: async (field) => {
        await this.enviarMensaje(field().value().mensaje.trim());
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  private async enviarMensaje(texto: string): Promise<void> {
    if (!texto || this.enviandoMensaje() || this.cargandoSustitucion()) return;

    const historialPrevio = this.historial();
    const itinerarioActual = this.itinerario();

    this.model.set({ mensaje: '' });
    this.enviandoMensaje.set(true);
    // Se muestra de inmediato, de forma optimista, mientras se espera la respuesta del asistente.
    this.historial.update((actual) => [...actual, { rol: 'USUARIO', contenido: texto }]);

    const request: RefinamientoRequest = {
      mensajeUsuario: texto,
      contextoConversacional: {
        itinerarioId: itinerarioActual.id,
        historialMensajes: historialPrevio,
        versionItinerario: itinerarioActual.version,
      },
    };

    try {
      const response = await firstValueFrom(
        this.itinerariosService.refinar(itinerarioActual.id, request)
      );
      this.historial.set(response.historialMensajes);
      this.itinerarioActualizado.emit(response.itinerario);
      if (response.actividadParaComparar) {
        this.compararAlternativas(response.actividadParaComparar);
      }
    } catch (error: unknown) {
      // Un fallo nunca deja cambios a medias ni inventa una respuesta del asistente: el mensaje
      // del usuario queda visible (ya se envió), sin respuesta, y el toast comunica el error.
      if (error instanceof HttpErrorResponse && error.status === 403) {
        this.toastService.error(ERROR_ACCESO_DENEGADO, undefined, TOAST_DURATION_MS);
      } else {
        this.toastService.error(
          apiErrorMessage(error) ?? ERROR_REFINAMIENTO,
          undefined,
          TOAST_DURATION_MS
        );
      }
    } finally {
      this.enviandoMensaje.set(false);
    }
  }

  protected compararAlternativas(actividadId: string): void {
    const itinerarioId = this.itinerario().id;
    this.actividadSeleccionadaId.set(actividadId);
    this.cargandoAlternativas.set(true);
    this.comparacionResponse.set(null);

    this.alternativasService.obtenerAlternativas(itinerarioId, actividadId).subscribe({
      next: (response) => {
        this.comparacionResponse.set(response);
        this.cargandoAlternativas.set(false);
        if (response.alternativas.length === 0 && response.mensaje) {
          this.toastService.info(response.mensaje, undefined, 5000);
        }
      },
      error: (err) => {
        this.cargandoAlternativas.set(false);
        if (err instanceof HttpErrorResponse && err.status === 403) {
          this.toastService.error(
            'No tienes permiso para acceder a este itinerario.',
            undefined,
            5000
          );
        } else {
          this.toastService.error(
            'No fue posible generar la comparación solicitada.',
            undefined,
            5000
          );
        }
      },
    });
  }

  protected onReemplazar(alternativa: AlternativaDTO): void {
    const itinerarioId = this.itinerario().id;
    const actividadId = this.actividadSeleccionadaId();
    if (!actividadId) return;

    const body: SustitucionRequest = {
      nombre: alternativa.nombre,
      descripcion: alternativa.descripcion,
      costoAproximado: alternativa.costoAproximado,
      moneda: alternativa.moneda,
      establecimientoRecomendado: alternativa.establecimientoRecomendado,
      ecoScore: alternativa.ecoScore,
      categoriaTuristica: this.comparacionResponse()!.categoriaTuristica,
      provincia: this.comparacionResponse()!.provincia,
    };

    this.cargandoSustitucion.set(true);
    // Reproduce la secuencia del wireframe: confirmación del usuario + mensaje transitorio del
    // asistente mientras se recalcula, que se reemplaza por el resultado final al terminar.
    this.historial.update((actual) => [
      ...actual,
      { rol: 'USUARIO', contenido: `Cambiado por ${alternativa.nombre}.` },
      { rol: 'ASISTENTE', contenido: 'Actualizando itinerario y recalculando EcoScore…' },
    ]);

    this.alternativasService.sustituirActividad(itinerarioId, actividadId, body).subscribe({
      next: (itinerarioActualizado) => {
        this.cargandoSustitucion.set(false);
        this.comparacionResponse.set(null);
        this.itinerarioActualizado.emit(itinerarioActualizado);
        this.toastService.success('Actividad reemplazada exitosamente.', undefined, 5000);
        this.reemplazarUltimoMensaje(`Listo, cambié la actividad por ${alternativa.nombre}.`);
      },
      error: (err) => {
        this.cargandoSustitucion.set(false);
        const mensajeError =
          err instanceof HttpErrorResponse && err.status === 403
            ? 'No tienes permiso para acceder a este itinerario.'
            : 'No fue posible realizar la sustitución. Intenta nuevamente.';
        this.toastService.error(mensajeError, undefined, 5000);
        this.reemplazarUltimoMensaje(mensajeError);
      },
    });
  }

  private reemplazarUltimoMensaje(contenido: string): void {
    this.historial.update((actual) => {
      if (actual.length === 0) return actual;
      const copia = [...actual];
      copia[copia.length - 1] = { rol: 'ASISTENTE', contenido };
      return copia;
    });
  }
}
