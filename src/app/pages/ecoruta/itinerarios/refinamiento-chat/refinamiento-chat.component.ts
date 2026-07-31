import { Component, computed, input } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Itinerario } from '../models/itinerario.model';

/**
 * Cascarón visual del chat de refinamiento (PP-88). Sin lógica de conversación real: solo
 * muestra un mensaje inicial estático y un campo deshabilitado, para que PP-88 lo construya
 * aislado de la página principal del itinerario.
 */
@Component({
  selector: 'app-refinamiento-chat',
  imports: [IconComponent],
  templateUrl: './refinamiento-chat.component.html',
  styleUrl: './refinamiento-chat.component.scss',
})
export class RefinamientoChatComponent {
  itinerario = input.required<Itinerario>();

  protected readonly mensajeInicial = computed(() => {
    const itinerario = this.itinerario();
    const dias = itinerario.cantidadDias;
    const score = itinerario.puntuacionAmbientalPreliminar;
    const scoreTexto = score !== null ? ` con un EcoScore de ${Math.round(score)}` : '';
    return `Tu itinerario de ${dias} día${dias === 1 ? '' : 's'} está listo${scoreTexto}. ¿Querés ajustar algo?`;
  });
}
