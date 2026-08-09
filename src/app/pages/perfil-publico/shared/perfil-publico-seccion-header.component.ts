import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LinkDirective } from '../../../shared/components/link/link.directive';
import { PerfilPublicoDTO } from '../perfil-publico.models';

@Component({
  selector: 'app-perfil-publico-seccion-header',
  imports: [HeadingComponent, IconComponent, LinkDirective, RouterLink],
  templateUrl: './perfil-publico-seccion-header.component.html',
  styleUrl: './perfil-publico-seccion-header.component.scss',
})
export class PerfilPublicoSeccionHeaderComponent {
  readonly perfil = input<PerfilPublicoDTO | null>(null);
  readonly slug = input.required<string>();
  readonly seccionLabel = input.required<string>();
  readonly eyebrow = input('Reconocimientos verificables');
  readonly titulo = input('');
  readonly subtitulo = input('');
  readonly conteo = input(0);
  readonly conteoLabel = input('');
  /**
   * Algunas secciones (p. ej. insignias) ya pintan su propia tarjeta de
   * resumen (eyebrow/título/conteo) dentro de un componente compartido. En
   * esos casos solo se necesita el breadcrumb, para no duplicar el resumen.
   */
  readonly mostrarResumen = input(true);

  readonly volver = output<void>();

  protected readonly nombreEmpresa = computed(() => this.perfil()?.nombreEmpresa ?? null);

  protected readonly tituloCompleto = computed(() => {
    const nombre = this.nombreEmpresa();
    return nombre ? `${this.titulo()} de ${nombre}` : this.titulo();
  });

  protected readonly crumbEmpresa = computed(() => this.nombreEmpresa() ?? 'Perfil público');
}
