import { DatePipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { InsigniaEmpresa, NivelInsigniaEmpresa } from '../../../core/empresa/empresa.models';
import { BadgeComponent, BadgeVariant } from '../badge/badge.component';
import { HeadingComponent } from '../heading/heading.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-insignias-empresa-list',
  imports: [BadgeComponent, DatePipe, HeadingComponent, IconComponent],
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

  protected seleccionar(insignia: InsigniaEmpresa): void {
    this.seleccion.set(this.llave(insignia));
  }

  protected nivelLabel(nivel: NivelInsigniaEmpresa): string {
    const labels: Record<NivelInsigniaEmpresa, string> = {
      bronce: 'Bronce',
      plata: 'Plata',
      oro: 'Oro',
    };
    return labels[nivel];
  }

  protected nivelVariant(nivel: NivelInsigniaEmpresa): BadgeVariant {
    const variants: Record<NivelInsigniaEmpresa, BadgeVariant> = {
      bronce: 'warning',
      plata: 'info',
      oro: 'success',
    };
    return variants[nivel];
  }

  protected readonly cantidadActivas = computed(() => this.insigniasOrdenadas().length);

  protected llave(insignia: InsigniaEmpresa): string {
    return `${insignia.idInsignia}-${insignia.nivelInsignia}`;
  }

  protected emisor(insignia: InsigniaEmpresa): string {
    const nombre = insignia.nombre.toLowerCase();
    if (nombre.includes('carbono neutral')) return 'DCC / MINAE via CarbonHub';
    if (nombre.includes('energia')) return 'ICE / CarbonHub';
    if (nombre.includes('reforestacion')) return 'FONAFIFO / CarbonHub';
    if (nombre.includes('residuos')) return 'MINAE / CarbonHub';
    if (nombre.includes('reporte')) return 'CarbonHub / Auditoria';
    return 'CarbonHub';
  }
}
