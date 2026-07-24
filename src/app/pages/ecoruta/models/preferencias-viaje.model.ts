import { ChipOption } from '../../../shared/components/inputs/chip-select/chip-select.component';
import { SelectOption } from '../../../shared/components/inputs/select-input/select-input.component';

export interface PreferenciasViajeRequest {
  cantidadDias: number;
  fechaInicio: string;
  tipoViaje: string;
  presupuesto: string | null;
  intereses: string[];
  provinciaPreferida: string | null;
  ubicacionActual: string | null;
  buscarCercaDeMi: boolean;
  limitacionesMovilidad: string | null;
  requiereHospedaje: boolean;
}

export interface PreferenciasViajeResponse extends PreferenciasViajeRequest {
  id: string;
  conversacionCompleta: boolean;
  recienCreada: boolean;
}

export const TIPO_VIAJE_OPTIONS: ChipOption[] = [
  { value: 'INDIVIDUAL', label: 'Solo/a' },
  { value: 'PAREJA', label: 'Pareja' },
  { value: 'FAMILIA', label: 'Familia' },
  { value: 'AMIGOS', label: 'Amigos' },
];

export const INTERES_OPTIONS: ChipOption[] = [
  { value: 'NATURALEZA', label: 'Naturaleza' },
  { value: 'VIDA_SILVESTRE', label: 'Vida silvestre' },
  { value: 'AVENTURA', label: 'Aventura' },
  { value: 'GASTRONOMIA_LOCAL', label: 'Gastronomía local' },
  { value: 'CULTURA', label: 'Cultura' },
  { value: 'PLAYAS', label: 'Playas' },
  { value: 'BIENESTAR', label: 'Bienestar' },
  { value: 'DEPORTES_EXTREMOS', label: 'Deportes extremos' },
  { value: 'HISTORIA', label: 'Historia' },
];

export const PROVINCIA_OPTIONS: SelectOption[] = [
  { value: 'SAN_JOSE', label: 'San José' },
  { value: 'ALAJUELA', label: 'Alajuela' },
  { value: 'CARTAGO', label: 'Cartago' },
  { value: 'HEREDIA', label: 'Heredia' },
  { value: 'GUANACASTE', label: 'Guanacaste' },
  { value: 'PUNTARENAS', label: 'Puntarenas' },
  { value: 'LIMON', label: 'Limón' },
];

export const PRESUPUESTO_OPTIONS: SelectOption[] = [
  { value: 'BAJO', label: 'Bajo' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'ALTO', label: 'Alto' },
];
