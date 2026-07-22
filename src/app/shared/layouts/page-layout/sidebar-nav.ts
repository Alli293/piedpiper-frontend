import { SidebarBottomItem, SidebarMenuItem } from '../../components/sidebar/sidebar.component';
import { IconName } from '../../components/icon/icon.component';
import { SidebarConfig } from './page-layout.component';

export type SidebarNavId = 'dashboard' | 'emissions' | 'benchmark' | 'ecoruta';

export interface SidebarNavItemDef {
  id: SidebarNavId;
  label: string;
  icon: IconName;
}

const SIDEBAR_NAV_ITEMS: readonly SidebarNavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'emissions', label: 'Mis Emisiones', icon: 'emisiones' },
  { id: 'benchmark', label: 'Madurez ambiental', icon: 'benchmark' },
];

/** Nav items for the individual-traveler shell (USUARIO_INDIVIDUAL) — distinct from the company sidebar above. */
export const ECORUTA_NAV_ITEMS: readonly SidebarNavItemDef[] = [
  { id: 'ecoruta', label: 'Planificar viaje', icon: 'viajero' },
];

const SIDEBAR_BOTTOM_ITEMS: readonly SidebarBottomItem[] = [
  { id: 'settings', label: 'Configuración', icon: 'config' },
  { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
];

export interface BuildSidebarConfigOptions {
  /** Which nav item is highlighted as the current page. Omit if the page isn't a menu item (e.g. settings). */
  activeId?: SidebarNavId;
  companyName: string;
  companyRole: string;
  companyInitials: string;
  /** Overrides the default 'Configuración' bottom-item label (e.g. for i18n). */
  settingsLabel?: string;
  /** Overrides the default company nav items (e.g. ECORUTA_NAV_ITEMS for the individual-traveler shell). */
  navItems?: readonly SidebarNavItemDef[];
}

export function buildSidebarConfig(options: BuildSidebarConfigOptions): SidebarConfig {
  const { activeId, companyName, companyRole, companyInitials } = options;
  const navItems = options.navItems ?? SIDEBAR_NAV_ITEMS;

  const menuItems: SidebarMenuItem[] = navItems.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: item.id === activeId,
  }));

  const bottomItems: SidebarBottomItem[] = options.settingsLabel
    ? SIDEBAR_BOTTOM_ITEMS.map((item) =>
        item.id === 'settings' ? { ...item, label: options.settingsLabel as string } : item
      )
    : [...SIDEBAR_BOTTOM_ITEMS];

  return { menuItems, bottomItems, companyName, companyRole, companyInitials };
}
