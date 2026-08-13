import { DatePipe } from '@angular/common';
import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { InsigniaEmpresa, NivelInsigniaEmpresa } from '../../../core/empresa/empresa.models';
import { BadgeComponent } from '../badge/badge.component';
import { ButtonComponent } from '../button/button.component';
import { EncabezadoResumenComponent } from '../encabezado-resumen/encabezado-resumen.component';
import { HeadingComponent } from '../heading/heading.component';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon-registry';
import { SemanticCardComponent } from '../semantic-card/semantic-card.component';

@Component({
  selector: 'app-insignias-empresa-list',
  imports: [
    BadgeComponent,
    ButtonComponent,
    DatePipe,
    EncabezadoResumenComponent,
    HeadingComponent,
    IconComponent,
    SemanticCardComponent,
  ],
  templateUrl: './insignias-empresa-list.component.html',
  styleUrl: './insignias-empresa-list.component.scss',
})
export class InsigniasEmpresaListComponent {
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

  protected readonly seleccion = signal<string | null>(null);

  protected readonly insigniasOrdenadas = computed(() =>
    [...this.insignias()].sort(
      (a, b) => new Date(b.fechaObtencion).getTime() - new Date(a.fechaObtencion).getTime()
    )
  );

  protected readonly insigniaSeleccionada = computed(() => {
    const insignias = this.insigniasOrdenadas();
    const seleccion = this.seleccion();
    return insignias.find((insignia) => this.llave(insignia) === seleccion) ?? insignias[0] ?? null;
  });

  constructor() {
    // Preselecciona la insignia indicada por query param (enlace de detalle) una
    // vez que la lista está disponible; no pisa una selección posterior del usuario.
    effect(() => {
      const insignias = this.insigniasOrdenadas();
      const llaveInicial = this.seleccionInicial();
      if (!llaveInicial || insignias.length === 0) return;
      untracked(() => {
        if (this.seleccion() === null) {
          this.seleccion.set(llaveInicial);
        }
      });
    });
  }

  protected seleccionar(insignia: InsigniaEmpresa): void {
    this.seleccion.set(this.llave(insignia));
  }

  protected esSeleccionada(insignia: InsigniaEmpresa): boolean {
    return (
      this.insigniaSeleccionada()?.idInsignia === insignia.idInsignia &&
      this.insigniaSeleccionada()?.nivelInsignia === insignia.nivelInsignia
    );
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
}
