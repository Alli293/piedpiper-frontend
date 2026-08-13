import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { RUTA_INICIO_POR_ROL, RolUsuario } from '../../core/models/perfil-inicial.model';

/**
 * Pantalla de "próximamente" para las rutas que todavía no tienen implementación.
 *
 * <p>El destino del botón depende de si hay sesión: a estas rutas se llega desde el menú lateral
 * estando dentro, y ofrecerle "volver al inicio de sesión" a alguien que ya inició sesión lo manda
 * fuera de donde estaba. Sin sesión sí corresponde el login, porque es la única salida útil.</p>
 */
@Component({
  selector: 'app-placeholder-page',
  imports: [RouterLink],
  templateUrl: './placeholder-page.component.html',
  styleUrl: './placeholder-page.component.scss',
})
export class PlaceholderPageComponent {
  private readonly authService = inject(AuthService);

  protected readonly haySesion = computed(() => this.authService.token() !== null);

  protected readonly rutaVolver = computed(() => {
    const rol = this.authService.rol();
    if (!rol || !(rol in RUTA_INICIO_POR_ROL)) {
      return '/login';
    }
    return `/${RUTA_INICIO_POR_ROL[rol as RolUsuario]}`;
  });

  protected readonly textoVolver = computed(() =>
    this.haySesion() ? 'Volver a mi panel' : 'Volver al inicio de sesión'
  );
}
