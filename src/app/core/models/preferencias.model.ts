import { SelectOption } from '../../shared/components/inputs/select-input/select-input.component';

export type Idioma = 'ESPANOL' | 'INGLES';
export type Moneda = 'CRC' | 'USD';
export type Unidades = 'METRICO';

export interface Preferencias {
  idioma: Idioma;
  moneda: Moneda;
  unidades: Unidades;
}

export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  idioma: 'ESPANOL',
  moneda: 'CRC',
  unidades: 'METRICO',
};

export const OPCIONES_IDIOMA: SelectOption[] = [
  { value: 'ESPANOL', label: 'Español' },
  { value: 'INGLES', label: 'Inglés' },
];

export const OPCIONES_MONEDA: SelectOption[] = [
  { value: 'CRC', label: 'Colón costarricense (CRC)' },
  { value: 'USD', label: 'Dólar estadounidense (USD)' },
];

export const OPCIONES_UNIDADES: SelectOption[] = [{ value: 'METRICO', label: 'Métrico' }];
