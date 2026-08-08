import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { AlternativasComparacionComponent } from '../alternativas-comparacion/alternativas-comparacion.component';
import { EcoRutaAlternativasService } from '../ecoruta-alternativas.service';
import {
  AlternativaDTO,
  ComparacionResponse,
  SustitucionRequest,
} from '../models/alternativas.model';
import { Itinerario, ItinerarioActividad } from '../models/itinerario.model';

@Component({
  selector: 'app-refinamiento-chat',
  imports: [IconComponent, AlternativasComparacionComponent],
  templateUrl: './refinamiento-chat.component.html',
  styleUrl: './refinamiento-chat.component.scss',
})
export class RefinamientoChatComponent {
  itinerario = input.required<Itinerario>();
  itinerarioActualizado = output<Itinerario>();

  private readonly alternativasService = inject(EcoRutaAlternativasService);
  private readonly toastService = inject(ToastService);

  // State for alternativas comparison
  protected readonly comparacionResponse = signal<ComparacionResponse | null>(null);
  protected readonly cargandoAlternativas = signal<boolean>(false);
  protected readonly cargandoSustitucion = signal<boolean>(false);
  protected readonly actividadSeleccionadaId = signal<string | null>(null);

  protected readonly mensajeInicial = computed(() => {
    const itinerario = this.itinerario();
    const dias = itinerario.cantidadDias;
    const score = itinerario.puntuacionAmbientalPreliminar;
    const scoreTexto =
      score !== null && score !== undefined ? ` con un EcoScore de ${Math.round(score)}` : '';
    return `Tu itinerario de ${dias} día${dias === 1 ? '' : 's'} está listo${scoreTexto}. ¿Querés ajustar algo?`;
  });

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
    };

    this.cargandoSustitucion.set(true);

    this.alternativasService.sustituirActividad(itinerarioId, actividadId, body).subscribe({
      next: (itinerarioActualizado) => {
        this.cargandoSustitucion.set(false);
        this.comparacionResponse.set(null);
        this.itinerarioActualizado.emit(itinerarioActualizado);
        this.toastService.success('Actividad reemplazada exitosamente.', undefined, 5000);
      },
      error: (err) => {
        this.cargandoSustitucion.set(false);
        if (err instanceof HttpErrorResponse && err.status === 403) {
          this.toastService.error(
            'No tienes permiso para acceder a este itinerario.',
            undefined,
            5000
          );
        } else {
          this.toastService.error(
            'No fue posible realizar la sustitución. Intenta nuevamente.',
            undefined,
            5000
          );
        }
      },
    });
  }
}
