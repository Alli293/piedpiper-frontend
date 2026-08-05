import { IconName } from '../../components/icon/icon.component';
import { SidebarBottomItem, SidebarMenuItem } from '../../components/sidebar/sidebar.component';
import { SidebarConfig } from './page-layout.component';

export type SidebarNavId =
  | 'dashboard'
  | 'emissions'
  | 'benchmark'
  | 'certificaciones'
  | 'insignias-empresa'
  | 'colaboradores'
  | 'settings'
  | 'ecoruta-planificar'
  | 'ecoruta-itinerarios'
  | 'ecoruta-insignias';

export type SidebarNavVariant = 'empresa' | 'ecoruta';

export interface SidebarNavItemDef {
  id: SidebarNavId;
  label: string;
  icon: IconName;
  /** Oculta el ítem salvo que el usuario sea administrador de empresa (ver `guardEmpresaAdmin`). */
  soloAdministrador?: boolean;
}

const SIDEBAR_NAV_ITEMS: Record<SidebarNavVariant, readonly SidebarNavItemDef[]> = {
  empresa: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'emissions', label: 'Mis Emisiones', icon: 'emisiones' },
    { id: 'certificaciones', label: 'Certificaciones', icon: 'certificaciones' },
    { id: 'benchmark', label: 'Madurez ambiental', icon: 'benchmark' },
    { id: 'insignias-empresa', label: 'Insignias', icon: 'insignias' },
    { id: 'colaboradores', label: 'Colaboradores', icon: 'colaboradores', soloAdministrador: true },
  ],
  ecoruta: [
    { id: 'ecoruta-planificar', label: 'Planificar viaje', icon: 'viajero' },
    { id: 'ecoruta-itinerarios', label: 'Mis itinerarios', icon: 'calendario' },
    { id: 'ecoruta-insignias', label: 'Mis insignias', icon: 'insignias' },
  ],
};

const SIDEBAR_BOTTOM_ITEMS: readonly SidebarBottomItem[] = [
  { id: 'settings', label: 'Configuración', icon: 'config' },
  { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
];

export interface BuildSidebarConfigOptions {
  /** Which nav item is highlighted as the current page. Omit if the page isn't in the sidebar. */
  activeId?: SidebarNavId;
  companyName: string;
  companyRole: string;
  companyInitials: string;
  /** Overrides the default settings bottom-item label. */
  settingsLabel?: string;
  variant?: SidebarNavVariant;
  /** Debe ser `true` para ver los ítems marcados como `soloAdministrador`. */
  esAdministradorEmpresa?: boolean;
}

export function buildSidebarConfig(options: BuildSidebarConfigOptions): SidebarConfig {
  const { activeId, companyName, companyRole, companyInitials } = options;
  const menuItems: SidebarMenuItem[] = SIDEBAR_NAV_ITEMS[options.variant ?? 'empresa']
    .filter((item) => !item.soloAdministrador || options.esAdministradorEmpresa)
    .map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      active: item.id === activeId,
    }));

  const bottomItems: SidebarBottomItem[] = SIDEBAR_BOTTOM_ITEMS.map((item) => ({
    ...item,
    label: item.id === 'settings' && options.settingsLabel ? options.settingsLabel : item.label,
    active: item.id === activeId,
  }));

  return { menuItems, bottomItems, companyName, companyRole, companyInitials };
}

// --- Auditor sidebar ---

export type AuditorSidebarNavId = 'auditorias' | 'perfil-publico';

export type AdminSidebarNavId = 'solicitudes-auditor';

/**
 * El administrador de plataforma solo tiene una pantalla construida (PP-21). Hasta que exista un
 * panel propio, este menú es su única forma de llegar a ella: antes aterrizaba en un placeholder
 * sin navegación y no podía moverse a ningún lado.
 */
const ADMIN_NAV_ITEMS: readonly { id: AdminSidebarNavId; label: string; icon: IconName }[] = [
  { id: 'solicitudes-auditor', label: 'Solicitudes de auditor', icon: 'auditor' },
];

export interface BuildAdminSidebarConfigOptions {
  activeId?: AdminSidebarNavId;
  adminName: string;
  adminInitials: string;
  settingsLabel?: string;
}

export function buildAdminSidebarConfig(options: BuildAdminSidebarConfigOptions): SidebarConfig {
  const menuItems: SidebarMenuItem[] = ADMIN_NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: item.id === options.activeId,
    disabled: false,
  }));

  const bottomItems: SidebarBottomItem[] = options.settingsLabel
    ? SIDEBAR_BOTTOM_ITEMS.map((item) =>
        item.id === 'settings' ? { ...item, label: options.settingsLabel as string } : item
      )
    : [...SIDEBAR_BOTTOM_ITEMS];

  return {
    menuItems,
    bottomItems,
    companyName: options.adminName,
    companyRole: 'Administrador de plataforma',
    companyInitials: options.adminInitials,
  };
}

interface AuditorNavItemDef {
  id: AuditorSidebarNavId;
  label: string;
  icon: IconName;
  disabled?: boolean;
}

const AUDITOR_NAV_ITEMS: readonly AuditorNavItemDef[] = [
  { id: 'auditorias', label: 'Auditorías', icon: 'auditorias', disabled: true },
  { id: 'perfil-publico', label: 'Perfil Público', icon: 'perfil-publico' },
];

export interface BuildAuditorSidebarConfigOptions {
  activeId?: AuditorSidebarNavId;
  auditorName: string;
  auditorInitials: string;
  settingsLabel?: string;
}

export function buildAuditorSidebarConfig(
  options: BuildAuditorSidebarConfigOptions
): SidebarConfig {
  const { activeId, auditorName, auditorInitials } = options;

  const menuItems: SidebarMenuItem[] = AUDITOR_NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: item.id === activeId,
    disabled: item.disabled ?? false,
  }));

  const bottomItems: SidebarBottomItem[] = options.settingsLabel
    ? SIDEBAR_BOTTOM_ITEMS.map((item) =>
        item.id === 'settings' ? { ...item, label: options.settingsLabel as string } : item
      )
    : [...SIDEBAR_BOTTOM_ITEMS];

  return {
    menuItems,
    bottomItems,
    companyName: auditorName,
    companyRole: 'Auditor · Verificado',
    companyInitials: auditorInitials,
  };
}
