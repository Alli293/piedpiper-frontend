import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { HeadingComponent } from '../../../../shared/components/heading/heading.component';
import {
  FilterChip,
  FilterChipsComponent,
} from '../../../../shared/components/filter-chips/filter-chips.component';
import { EstablecimientoBannerService } from '../establecimiento-banner.service';
import { EstablecimientoEcoScore } from '../models/establecimiento-ecoscore.model';
import { BannerOrigen } from '../models/origen-banner.model';
import { OrigenBannerComponent } from '../origen-banner/origen-banner.component';
import { PuntuacionAmbientalBadgeComponent } from '../puntuacion-ambiental-badge/puntuacion-ambiental-badge.component';

const TODOS_LOS_PAISES = 'TODOS';

/**
 * Desglose por establecimiento del itinerario (PP-91), extendido en PP-95 con el banner de
 * origen del emprendedor y un filtro por país. Por cada establecimiento con `empresaId` (ver
 * `EstablecimientoEcoScore`) pide su banner por separado — cada petición se resuelve o falla de
 * forma independiente, así una falla puntual de REST Countries nunca afecta al resto de la lista
 * ni muestra un error al usuario (Req PP-95).
 */
@Component({
  selector: 'app-establecimientos-evaluados',
  imports: [
    HeadingComponent,
    FilterChipsComponent,
    OrigenBannerComponent,
    PuntuacionAmbientalBadgeComponent,
  ],
  templateUrl: './establecimientos-evaluados.component.html',
  styleUrl: './establecimientos-evaluados.component.scss',
})
export class EstablecimientosEvaluadosComponent {
  establecimientos = input.required<EstablecimientoEcoScore[]>();

  private readonly bannerService = inject(EstablecimientoBannerService);

  protected readonly banners = signal<Map<string, BannerOrigen | null>>(new Map());
  protected readonly filtroPais = signal<string>(TODOS_LOS_PAISES);

  protected readonly chipsPais = computed<FilterChip[]>(() => {
    const establecimientos = this.establecimientos();
    const nombrePorCodigo = new Map<string, string>();
    const conteoPorCodigo = new Map<string, number>();

    for (const establecimiento of establecimientos) {
      const banner = this.bannerDe(establecimiento);
      if (!banner?.codigoIso || !banner.nombrePais) continue;
      nombrePorCodigo.set(banner.codigoIso, banner.nombrePais);
      conteoPorCodigo.set(banner.codigoIso, (conteoPorCodigo.get(banner.codigoIso) ?? 0) + 1);
    }

    const chips: FilterChip[] = [
      { id: TODOS_LOS_PAISES, label: 'Todos los países', count: establecimientos.length },
    ];
    for (const [codigoIso, nombrePais] of nombrePorCodigo) {
      chips.push({ id: codigoIso, label: nombrePais, count: conteoPorCodigo.get(codigoIso) });
    }
    return chips;
  });

  protected readonly establecimientosFiltrados = computed(() => {
    const filtro = this.filtroPais();
    if (filtro === TODOS_LOS_PAISES) {
      return this.establecimientos();
    }
    return this.establecimientos().filter((est) => this.bannerDe(est)?.codigoIso === filtro);
  });

  constructor() {
    effect(() => {
      for (const establecimiento of this.establecimientos()) {
        const empresaId = establecimiento.empresaId;
        if (empresaId && !this.banners().has(empresaId)) {
          this.cargarBanner(empresaId);
        }
      }
    });
  }

  protected bannerDe(establecimiento: EstablecimientoEcoScore): BannerOrigen | null {
    if (!establecimiento.empresaId) return null;
    return this.banners().get(establecimiento.empresaId) ?? null;
  }

  protected onFiltroChange(chipId: string): void {
    this.filtroPais.set(chipId);
  }

  private cargarBanner(empresaId: string): void {
    // Se marca de inmediato (con null) para no disparar la misma petición dos veces si el efecto
    // vuelve a correr antes de que la respuesta llegue.
    this.banners.update((actual) => new Map(actual).set(empresaId, null));

    this.bannerService
      .obtenerBanner(empresaId)
      .pipe(catchError(() => of({ banner: null })))
      .subscribe((response) => {
        this.banners.update((actual) => new Map(actual).set(empresaId, response.banner));
      });
  }
}
