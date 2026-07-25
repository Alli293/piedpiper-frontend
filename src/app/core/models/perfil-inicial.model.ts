import { SelectOption } from '../../shared/components/inputs/select-input/select-input.component';
import { Preferencias } from './preferencias.model';

export type RolUsuario =
  | 'USUARIO_INDIVIDUAL'
  | 'USUARIO_GENERAL'
  | 'ADMINISTRADOR_EMPRESA'
  | 'AUDITOR_CERTIFICADO'
  | 'ADMINISTRADOR_PLATAFORMA';

/** Texto de rol mostrado en `ch-sidebar__company-role`. */
export const ROL_SIDEBAR_LABEL: Record<RolUsuario, string> = {
  USUARIO_INDIVIDUAL: 'Viajes · EcoRuta',
  USUARIO_GENERAL: 'Empresa · Usuario',
  ADMINISTRADOR_EMPRESA: 'Empresa · Admin',
  AUDITOR_CERTIFICADO: 'Auditor Certificado',
  ADMINISTRADOR_PLATAFORMA: 'Administrador',
};

/**
 * Ruta a la que se redirige a un usuario autenticado cuando intenta acceder
 * a una ruta protegida para la que su rol no tiene permiso (ver `rolGuard`).
 */
export const RUTA_INICIO_POR_ROL: Record<RolUsuario, string> = {
  USUARIO_INDIVIDUAL: 'ecoruta/preferencias',
  USUARIO_GENERAL: 'empresa/panel',
  ADMINISTRADOR_EMPRESA: 'empresa/panel',
  AUDITOR_CERTIFICADO: 'auditor/panel',
  ADMINISTRADOR_PLATAFORMA: 'admin/panel',
};

export interface EmpresaPerfil {
  nombreEmpresa: string;
  sectorIndustrial: string | null;
  pais: string;
  cantidadEmpleados: number;
}

export interface PerfilInicial {
  nombreVisible: string;
  nombre: string;
  apellidos: string;
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
