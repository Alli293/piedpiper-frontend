import { Observable, firstValueFrom } from 'rxjs';

import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { CatalogoItem } from './auditor.model';

export interface ResultadoCatalogoAuditor {
  items: CatalogoItem[];
  disponible: boolean;
}

export async function cargarCatalogoAuditor(
  catalogo$: Observable<CatalogoItem[]>,
  toastService: ToastService,
  mensajeFallback: string
): Promise<ResultadoCatalogoAuditor> {
  try {
    return { items: await firstValueFrom(catalogo$), disponible: true };
  } catch (err: unknown) {
    toastService.error(apiErrorMessage(err) ?? mensajeFallback, undefined, 5000);
    return { items: [], disponible: false };
  }
}

export function mapaEtiquetasCatalogo(items: readonly CatalogoItem[]): Map<string, string> {
  return new Map(items.map((item) => [item.valor, item.etiqueta]));
}
