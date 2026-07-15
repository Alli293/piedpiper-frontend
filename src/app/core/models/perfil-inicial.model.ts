import { SelectOption } from '../../shared/components/inputs/select-input/select-input.component';
import { Preferencias } from './preferencias.model';

export type RolUsuario =
  'USUARIO_INDIVIDUAL' | 'USUARIO_GENERAL' | 'ADMINISTRADOR_EMPRESA' | 'AUDITOR_CERTIFICADO';

export interface EmpresaPerfil {
  nombreEmpresa: string;
  sectorIndustrial: string | null;
  pais: string;
  cantidadEmpleados: number;
}

export interface PerfilInicial {
  nombreVisible: string;
  preferencias: Preferencias;
  rol: RolUsuario;
  configuracionCompleta: boolean;
  redirect: string;
  empresa: EmpresaPerfil | null;
}

export interface DatosEmpresaPerfilRequest {
  sectorIndustrial: string;
  pais: string;
  cantidadEmpleados: number;
}

export interface PerfilInicialRequest {
  nombreVisible: string;
  preferencias: Preferencias;
  empresa?: DatosEmpresaPerfilRequest;
}

export const OPCIONES_SECTOR: SelectOption[] = [
  { value: 'HOTELERIA', label: 'Hotelería' },
  { value: 'AGROINDUSTRIA', label: 'Agroindustria' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'MANUFACTURA', label: 'Manufactura' },
  { value: 'SERVICIOS', label: 'Servicios' },
  { value: 'RETAIL', label: 'Retail / Comercio' },
  { value: 'OTRO', label: 'Otro' },
];
