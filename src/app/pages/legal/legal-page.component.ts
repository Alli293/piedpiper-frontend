import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { LinkDirective } from '../../shared/components/link/link.directive';
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
 *
 * <p>Aun así el valor se valida contra el catálogo antes de usarlo. La data de la ruta es un
 * {@code Record<string, unknown>}: si alguien agrega una ruta a este componente y olvida el
 * {@code documento}, o lo escribe mal, afirmar el tipo a ciegas daría un contenido {@code undefined}
 * y la pantalla reventaría en el primer binding, sin ninguna pista de la causa. Con la validación
 * cae a los términos de uso, que es un documento real, y el aviso queda en consola para quien
 * configuró la ruta.</p>
 */
@Component({
  selector: 'app-legal-page',
  imports: [HeadingComponent, LinkDirective, LogoComponent, RouterLink],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly datos = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

  protected readonly ultimaActualizacion = ULTIMA_ACTUALIZACION;

  protected readonly documentoActual = computed<TipoDocumentoLegal>(() => {
    const declarado = this.datos()['documento'];
    if (esTipoDocumentoLegal(declarado)) {
      return declarado;
    }
    console.warn(
      `La ruta llegó a LegalPageComponent con documento="${String(declarado)}", que no está en el catálogo legal. Se muestran los términos de uso.`
    );
    return 'terminos';
  });

  protected readonly documento = computed<DocumentoLegal>(
    () => CONTENIDOS_LEGALES[this.documentoActual()]
  );
}

/** El catálogo es la única fuente de verdad: si el documento no está ahí, no se puede mostrar. */
function esTipoDocumentoLegal(valor: unknown): valor is TipoDocumentoLegal {
  return typeof valor === 'string' && valor in CONTENIDOS_LEGALES;
}
