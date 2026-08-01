import { Component, computed, input, output, signal } from '@angular/core';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  CalendarioVencimientosResponse,
  CertificacionVencimiento,
  UrgenciaVencimiento,
} from '../dashboard/dashboard.model';

interface DiaCalendario {
  readonly fecha: string;
  readonly dia: number;
  readonly fueraDeMes: boolean;
  readonly esHoy: boolean;
  readonly vencimientos: CertificacionVencimiento[];
}

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Del más al menos urgente: si un día tiene vencimientos con distinta urgencia
// (posible solo si dos certificaciones vencen el mismo día, cosa infrecuente
// pero no imposible), el punto del día se pinta con la más urgente.
const ORDEN_URGENCIA: UrgenciaVencimiento[] = ['7_dias', '30_dias', '90_dias'];

const ERROR_POR_DEFECTO = 'No fue posible cargar esta sección. Intenta recargar la página.';

/**
 * Calendario de vencimientos (PP-77): vista mensual de solo lectura con un
 * indicador por día que tiene certificaciones venciendo ese día. El fetch y
 * el manejo de error viven en la página contenedora (mismo patrón que
 * `estado-certificaciones-panel`), así que este componente es puramente
 * presentacional salvo por la selección de día, que es estado de UI local
 * (no requiere datos nuevos: el mes visible ya está completo en `calendario`).
 */
@Component({
  selector: 'app-calendario-vencimientos',
  imports: [HeadingComponent, IconComponent],
  templateUrl: './calendario-vencimientos.component.html',
  styleUrl: './calendario-vencimientos.component.scss',
})
export class CalendarioVencimientosComponent {
  /** Mes visible, formato 'YYYY-MM'. Lo controla la página contenedora. */
  readonly mes = input.required<string>();
  readonly calendario = input<CalendarioVencimientosResponse | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  /** Se emite cuando el usuario navega a otro mes; 'YYYY-MM'. */
  readonly mesChange = output<string>();

  protected readonly errorMensaje = computed(() => this.error() ?? ERROR_POR_DEFECTO);
  protected readonly diasSemana = DIAS_SEMANA;

  protected readonly tituloMes = computed(() => this.formatearTitulo(this.mes()));

  protected readonly semanas = computed<DiaCalendario[][]>(() =>
    this.construirSemanas(this.mes(), this.calendario()?.vencimientosPorFecha ?? {})
  );

  protected readonly fechaSeleccionada = signal<string | null>(null);

  protected readonly diaSeleccionado = computed<DiaCalendario | null>(() => {
    const fecha = this.fechaSeleccionada();
    if (!fecha) return null;
    return (
      this.semanas()
        .flat()
        .find((dia) => dia.fecha === fecha && !dia.fueraDeMes) ?? null
    );
  });

  protected mesAnterior(): void {
    this.mesChange.emit(this.desplazarMes(this.mes(), -1));
  }

  protected mesSiguiente(): void {
    this.mesChange.emit(this.desplazarMes(this.mes(), 1));
  }

  protected seleccionarDia(dia: DiaCalendario): void {
    if (dia.fueraDeMes || dia.vencimientos.length === 0) return;
    this.fechaSeleccionada.set(this.fechaSeleccionada() === dia.fecha ? null : dia.fecha);
  }

  protected urgenciaDelDia(dia: DiaCalendario): UrgenciaVencimiento | null {
    for (const urgencia of ORDEN_URGENCIA) {
      if (dia.vencimientos.some((v) => v.urgencia === urgencia)) return urgencia;
    }
    return null;
  }

  protected fechaLegible(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const formateado = new Intl.DateTimeFormat('es-CR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(anio, mes - 1, dia));
    return this.capitalizar(formateado);
  }

  private formatearTitulo(mes: string): string {
    const [anio, mesNum] = mes.split('-').map(Number);
    const formateado = new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' }).format(
      new Date(anio, mesNum - 1, 1)
    );
    return this.capitalizar(formateado);
  }

  private capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  private desplazarMes(mes: string, delta: number): string {
    const [anio, mesNum] = mes.split('-').map(Number);
    const fecha = new Date(anio, mesNum - 1 + delta, 1);
    return `${fecha.getFullYear()}-${this.pad2(fecha.getMonth() + 1)}`;
  }

  private construirSemanas(
    mes: string,
    vencimientosPorFecha: Record<string, CertificacionVencimiento[]>
  ): DiaCalendario[][] {
    const [anio, mesNum] = mes.split('-').map(Number);
    const mesIndex = mesNum - 1;
    const hoy = this.fechaDeHoy();

    // Lunes = 0 ... domingo = 6 (JS usa domingo = 0 por defecto).
    const offsetInicio = (new Date(anio, mesIndex, 1).getDay() + 6) % 7;
    const diasEnMes = new Date(anio, mesIndex + 1, 0).getDate();
    const diasMesAnterior = new Date(anio, mesIndex, 0).getDate();

    const celdas: DiaCalendario[] = [];

    for (let i = offsetInicio; i > 0; i--) {
      const dia = diasMesAnterior - i + 1;
      const anioPrev = mesIndex === 0 ? anio - 1 : anio;
      const mesPrev = mesIndex === 0 ? 12 : mesIndex;
      celdas.push(this.celda(anioPrev, mesPrev, dia, true, hoy, vencimientosPorFecha));
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      celdas.push(this.celda(anio, mesIndex + 1, dia, false, hoy, vencimientosPorFecha));
    }

    let diaSiguiente = 1;
    while (celdas.length % 7 !== 0) {
      const anioNext = mesIndex === 11 ? anio + 1 : anio;
      const mesNext = mesIndex === 11 ? 1 : mesIndex + 2;
      celdas.push(this.celda(anioNext, mesNext, diaSiguiente, true, hoy, vencimientosPorFecha));
      diaSiguiente++;
    }

    const semanas: DiaCalendario[][] = [];
    for (let i = 0; i < celdas.length; i += 7) {
      semanas.push(celdas.slice(i, i + 7));
    }
    return semanas;
  }

  private celda(
    anio: number,
    mes1: number,
    dia: number,
    fueraDeMes: boolean,
    hoy: string,
    vencimientosPorFecha: Record<string, CertificacionVencimiento[]>
  ): DiaCalendario {
    const fecha = `${anio}-${this.pad2(mes1)}-${this.pad2(dia)}`;
    return {
      fecha,
      dia,
      fueraDeMes,
      esHoy: fecha === hoy,
      vencimientos: vencimientosPorFecha[fecha] ?? [],
    };
  }

  private fechaDeHoy(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${this.pad2(hoy.getMonth() + 1)}-${this.pad2(hoy.getDate())}`;
  }

  private pad2(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}
