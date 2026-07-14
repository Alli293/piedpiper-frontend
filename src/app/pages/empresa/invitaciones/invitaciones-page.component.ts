import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import {
  EstadoInvitacion,
  Invitacion,
  InvitacionesService,
} from '../../../core/invitaciones/invitaciones.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ESTADOS: Record<EstadoInvitacion, { etiqueta: string; variante: BadgeVariant }> = {
  ENVIADA: { etiqueta: 'Enviada', variante: 'info' },
  ACEPTADA: { etiqueta: 'Aceptada', variante: 'success' },
  EXPIRADA: { etiqueta: 'Expirada', variante: 'warning' },
  REVOCADA: { etiqueta: 'Revocada', variante: 'danger' },
};

@Component({
  selector: 'app-invitaciones-page',
  imports: [BadgeComponent, ButtonComponent, TextInputComponent, DatePipe],
  templateUrl: './invitaciones-page.component.html',
  styleUrl: './invitaciones-page.component.scss',
})
export class InvitacionesPageComponent {
  private readonly invitacionesService = inject(InvitacionesService);

  protected readonly email = signal('');
  protected readonly errorEmail = signal('');
  protected readonly enviando = signal(false);
  protected readonly mensajeExito = signal('');
  protected readonly mensajeError = signal('');

  protected readonly invitaciones = signal<Invitacion[]>([]);
  protected readonly cargando = signal(true);
  protected readonly invitacionARevocar = signal<Invitacion | null>(null);
  protected readonly revocando = signal(false);

  constructor() {
    this.cargarInvitaciones();
  }

  protected etiqueta(estado: EstadoInvitacion): string {
    return ESTADOS[estado]?.etiqueta ?? estado;
  }

  protected variante(estado: EstadoInvitacion): BadgeVariant {
    return ESTADOS[estado]?.variante ?? 'neutral';
  }

  protected enviar(event?: Event): void {
    event?.preventDefault();
    if (this.enviando()) {
      return;
    }
    this.mensajeExito.set('');
    this.mensajeError.set('');
    const email = this.email().trim();
    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      this.errorEmail.set('Ingresa un correo electrónico válido');
      return;
    }
    this.errorEmail.set('');
    this.enviando.set(true);
    this.invitacionesService.emitir(email).subscribe({
      next: (invitacion) => {
        this.enviando.set(false);
        this.email.set('');
        this.mensajeExito.set(`Invitación enviada a ${invitacion.email}.`);
        this.invitaciones.update((lista) => [invitacion, ...lista]);
      },
      error: (err) => {
        this.enviando.set(false);
        this.mensajeError.set(
          err?.error?.message ?? 'No pudimos enviar la invitación. Intenta nuevamente.'
        );
      },
    });
  }

  protected abrirRevocacion(invitacion: Invitacion): void {
    this.invitacionARevocar.set(invitacion);
  }

  protected cerrarRevocacion(): void {
    if (!this.revocando()) {
      this.invitacionARevocar.set(null);
    }
  }

  protected confirmarRevocacion(): void {
    const invitacion = this.invitacionARevocar();
    if (!invitacion || this.revocando()) {
      return;
    }
    this.mensajeExito.set('');
    this.mensajeError.set('');
    this.revocando.set(true);
    this.invitacionesService.revocar(invitacion.id).subscribe({
      next: (revocada) => {
        this.revocando.set(false);
        this.invitacionARevocar.set(null);
        this.invitaciones.update((lista) =>
          lista.map((i) => (i.id === revocada.id ? revocada : i))
        );
        this.mensajeExito.set(`Invitación a ${revocada.email} revocada.`);
      },
      error: (err) => {
        this.revocando.set(false);
        this.invitacionARevocar.set(null);
        this.mensajeError.set(
          err?.error?.message ?? 'No pudimos revocar la invitación. Intenta nuevamente.'
        );
      },
    });
  }

  private cargarInvitaciones(): void {
    this.invitacionesService.listar().subscribe({
      next: (lista) => {
        this.invitaciones.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.mensajeError.set(
          err?.error?.message ?? 'No pudimos cargar las invitaciones. Intenta nuevamente.'
        );
      },
    });
  }
}
