import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { RUTA_INICIO_POR_ROL, RolUsuario } from '../../core/models/perfil-inicial.model';

/**
 * Pantalla de "próximamente" para las rutas que todavía no tienen implementación.
 *
 * <p>El destino del botón depende de si se puede resolver un panel para el rol de la sesión: a
 * estas rutas se llega desde el menú lateral estando dentro, y ofrecerle "volver al inicio de
 * sesión" a alguien que ya inició sesión lo manda fuera de donde estaba. Cuando no hay panel al
 * que volver, el login es la única salida útil.</p>
 *
 * <p><b>Un solo cálculo decide el destino y el texto.</b> Antes el texto salía de "hay token" y el
 * destino de "el rol es conocido", que son dos preguntas distintas: con un token presente pero un
 * rol que el front no reconoce —o un token corrupto, donde {@code rol()} devuelve nulo— el botón
 * decía "Volver a mi panel" y navegaba al login. Es el mismo tipo de contradicción entre texto y
 * destino que esta pantalla existe para no tener.</p>
 */
@Component({
  selector: 'app-placeholder-page',
  imports: [RouterLink],
  templateUrl: './placeholder-page.component.html',
  styleUrl: './placeholder-page.component.scss',
})
export class PlaceholderPageComponent {
  private readonly authService = inject(AuthService);

  /** Única fuente de verdad: si es falso, no hay panel al que volver y todo apunta al login. */
  protected readonly hayPanelPropio = computed(() => esRolConocido(this.authService.rol()));

  protected readonly rutaVolver = computed(() => {
    const rol = this.authService.rol();
    return esRolConocido(rol) ? `/${RUTA_INICIO_POR_ROL[rol]}` : '/login';
  });

  protected readonly textoVolver = computed(() =>
    this.hayPanelPropio() ? 'Volver a mi panel' : 'Volver al inicio de sesión'
  );
}

/**
 * El rol llega como texto desde el token, así que puede ser cualquier cosa: un rol nuevo del backend
 * que el front todavía no conoce, o un token viejo. Como predicado de tipo, el compilador exige que
 * la comprobación pase antes de indexar el mapa, en vez de confiar en un cast que no verifica nada.
 */
function esRolConocido(rol: string | null): rol is RolUsuario {
  return rol !== null && rol in RUTA_INICIO_POR_ROL;
}
