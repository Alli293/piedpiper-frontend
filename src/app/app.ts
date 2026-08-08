import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from './shared/components/toast/toast.component';
import { InsigniaNotificacionHostComponent } from './shared/components/insignia-notificacion/insignia-notificacion-host.component';
import { SesionInactividadService } from './core/auth/sesion-inactividad.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent, InsigniaNotificacionHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** Se instancia aquí para que el temporizador de inactividad arranque
   * apenas haya un token en sessionStorage (login o recarga con sesión activa),
   * sin depender de que la página actual dispare una petición autenticada. */
  private readonly sesionInactividadService = inject(SesionInactividadService);
}
