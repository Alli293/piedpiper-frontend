import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { InsigniaEmpresa, NivelInsigniaEmpresa } from '../../../core/empresa/empresa.models';
import {
  DetallePanelAccion,
  DetallePanelComponent,
  DetallePanelDato,
} from '../detalle-panel/detalle-panel.component';
import { BadgeComponent } from '../badge/badge.component';
import { ButtonComponent } from '../button/button.component';
import { EncabezadoResumenComponent } from '../encabezado-resumen/encabezado-resumen.component';
import { HeadingComponent } from '../heading/heading.component';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon-registry';
import { ModalComponent } from '../modal/modal.component';
import { SemanticCardComponent } from '../semantic-card/semantic-card.component';

@Component({
  selector: 'app-insignias-empresa-list',
  imports: [
    BadgeComponent,
    ButtonComponent,
    DatePipe,
    DetallePanelComponent,
    EncabezadoResumenComponent,
    HeadingComponent,
    IconComponent,
    ModalComponent,
    SemanticCardComponent,
  ],
  providers: [DatePipe],
  templateUrl: './insignias-empresa-list.component.html',
  styleUrl: './insignias-empresa-list.component.scss',
})
export class InsigniasEmpresaListComponent {
  private readonly datePipe = inject(DatePipe);

  insignias = input.required<InsigniaEmpresa[]>();
  titulo = input('Insignias activas');
  descripcion = input(
    'Reconocimientos vigentes emitidos como credenciales verificables de la empresa.'
  );
  nombreEmpresa = input<string>();
  accionesPrivadas = input(false);
  /** Llave (`idInsignia-nivelInsignia`) de la insignia a preseleccionar, p. ej. al llegar desde un enlace de detalle. */
  seleccionInicial = input<string | null>(null);
  /**
   * Algunas paginas (p. ej. el perfil publico) ya pintan su propia tarjeta de
   * resumen (eyebrow/titulo/conteo) con `app-perfil-publico-seccion-header`. En
   * esos casos se oculta el resumen propio de esta lista para no duplicarlo.
   */
  mostrarResumen = input(true);

  descargarJsonLd = output<InsigniaEmpresa>();
  verificarOpenBadges = output<InsigniaEmpresa>();
  descargarJwt = output<InsigniaEmpresa>();
  compartirLinkedIn = output<InsigniaEmpresa>();

  /** Llave de la insignia cuyo modal de detalle esta abierto; `null` = cerrado. */
  protected readonly detalleAbiertoLlave = signal<string | null>(null);

  protected readonly insigniasOrdenadas = computed(() =>
    [...this.insignias()].sort(
      (a, b) => new Date(b.fechaObtencion).getTime() - new Date(a.fechaObtencion).getTime()
    )
  );

  protected readonly insigniaSeleccionada = computed(() => {
    const llave = this.detalleAbiertoLlave();
    if (llave === null) return null;
    return this.insigniasOrdenadas().find((insignia) => this.llave(insignia) === llave) ?? null;
  });

  constructor() {
    // Abre el modal de la insignia indicada por query param (enlace de
    // detalle) una vez que la lista esta disponible; no pisa una seleccion
    // posterior del usuario.
    effect(() => {
      const insignias = this.insigniasOrdenadas();
      const llaveInicial = this.seleccionInicial();
      if (!llaveInicial || insignias.length === 0) return;
      untracked(() => {
        if (this.detalleAbiertoLlave() === null) {
          this.detalleAbiertoLlave.set(llaveInicial);
        }
      });
    });
  }

  protected abrirDetalle(insignia: InsigniaEmpresa): void {
    this.detalleAbiertoLlave.set(this.llave(insignia));
  }

  protected cerrarDetalle(): void {
    this.detalleAbiertoLlave.set(null);
  }

  protected nivelLabel(nivel: NivelInsigniaEmpresa): string {
    const labels: Record<NivelInsigniaEmpresa, string> = {
      bronce: 'Bronce',
      plata: 'Plata',
      oro: 'Oro',
    };
    return labels[nivel];
  }

  protected nivelIcono(nivel: NivelInsigniaEmpresa): IconName {
    const iconos: Record<NivelInsigniaEmpresa, IconName> = {
      bronce: 'medal-bronze',
      plata: 'medal-silver',
      oro: 'medal-gold',
    };
    return iconos[nivel];
  }

  protected readonly cantidadActivas = computed(() => this.insigniasOrdenadas().length);

  protected llave(insignia: InsigniaEmpresa): string {
    return `${insignia.idInsignia}-${insignia.nivelInsignia}`;
  }

  protected emisor(insignia: InsigniaEmpresa): string {
    return insignia.emisor ?? 'CarbonHub';
  }

  protected criterios(insignia: InsigniaEmpresa): string {
    return (
      insignia.criteriosObtencion ??
      'Esta insignia fue otorgada automaticamente porque la empresa cumplio los requisitos configurados en la plataforma.'
    );
  }

  protected datoDetalle(insignia: InsigniaEmpresa): DetallePanelDato {
    return {
      icono: 'insignias',
      iconoModificador: insignia.nivelInsignia,
      titulo: insignia.nombre,
      heroBadge: { etiqueta: 'Insignia activa', variant: 'success', icono: 'success' },
      eyebrow: 'Información de emisión',
      campos: [
        { icono: 'insignias', etiqueta: 'Insignia', valor: insignia.nombre },
        {
          icono: this.nivelIcono(insignia.nivelInsignia),
          etiqueta: 'Nivel',
          valor: this.nivelLabel(insignia.nivelInsignia),
        },
        { icono: 'empresa', etiqueta: 'Emisor', valor: this.emisor(insignia) },
        {
          icono: 'calendario',
          etiqueta: 'Obtenida',
          valor: this.datePipe.transform(insignia.fechaObtencion, 'dd/MM/yyyy') ?? '',
        },
        { icono: 'success', etiqueta: 'Criterios', valor: this.criterios(insignia) },
      ],
      credencial: {
        titulo: 'Credencial verificable',
        subtitulo: 'Estándar OpenBadges 3.0',
        descripcion:
          'Esta insignia es una credencial verificable. Comprueba su autenticidad e integridad de forma con un verificador compatible con OpenBadges 3.0.',
      },
    };
  }

  protected accionesDetalle(insignia: InsigniaEmpresa): DetallePanelAccion[] {
    const acciones: DetallePanelAccion[] = [];
    const privadas = this.accionesPrivadas();

    if (privadas && insignia.urlVerificacionJwt) {
      acciones.push({
        id: 'descargar',
        etiqueta: 'Descargar (JWT)',
        icono: 'descargar',
        variant: 'secondary',
      });
    }
    if (insignia.codigoVerificacion) {
      acciones.push({
        id: 'verificar',
        etiqueta: 'Verificar',
        icono: 'redirect',
        variant: privadas ? 'secondary' : 'primary',
      });
    }
    if (privadas && insignia.urlLinkedIn) {
      acciones.push({
        id: 'compartir',
        etiqueta: 'Compartir',
        icono: 'linkedin',
        variant: 'primary',
      });
    }
    return acciones;
  }

  protected onAccionDetalle(id: string, insignia: InsigniaEmpresa): void {
    switch (id) {
      case 'verificar':
        this.verificarOpenBadges.emit(insignia);
        break;
      case 'descargar':
        this.descargarJwt.emit(insignia);
        break;
      case 'compartir':
        this.compartirLinkedIn.emit(insignia);
        break;
    }
  }
}
