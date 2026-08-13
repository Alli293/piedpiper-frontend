import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import {
  CONTENIDOS_LEGALES,
  DocumentoLegal,
  TipoDocumentoLegal,
  ULTIMA_ACTUALIZACION,
} from './legal.content';

/**
 * Sirve los dos documentos legales desde un solo componente porque comparten estructura: portada,
 * secciones de texto y pie con la fecha. Duplicar la pantalla para cambiar solo el contenido dejaría
 * dos maquetas que se desincronizan a la primera corrección de estilo.
 *
 * <p>El tipo de documento viene de la data de la ruta y no de la URL: así una ruta nueva no puede
 * caer aquí sin contenido, porque tendría que declarar el tipo explícitamente.</p>
 */
@Component({
  selector: 'app-legal-page',
  imports: [HeadingComponent, LogoComponent, RouterLink],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly datos = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

  protected readonly ultimaActualizacion = ULTIMA_ACTUALIZACION;

  protected readonly documentoActual = computed<TipoDocumentoLegal>(
    () => this.datos()['documento'] as TipoDocumentoLegal
  );

  protected readonly documento = computed<DocumentoLegal>(
    () => CONTENIDOS_LEGALES[this.documentoActual()]
  );
}
