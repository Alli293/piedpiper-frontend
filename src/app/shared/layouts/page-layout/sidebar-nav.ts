import { IconName } from '../../components/icon/icon.component';
import { SidebarBottomItem, SidebarMenuItem } from '../../components/sidebar/sidebar.component';
import { SidebarConfig } from './page-layout.component';

export type SidebarNavId =
  | 'dashboard'
  | 'emissions'
  | 'benchmark'
  | 'ecoruta-planificar'
  | 'ecoruta-itinerarios'
  | 'ecoruta-insignias';

export type SidebarNavVariant = 'empresa' | 'ecoruta';

export interface SidebarNavItemDef {
  id: SidebarNavId;
  label: string;
  icon: IconName;
}

const SIDEBAR_NAV_ITEMS: Record<SidebarNavVariant, readonly SidebarNavItemDef[]> = {
  empresa: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'emissions', label: 'Mis Emisiones', icon: 'emisiones' },
    { id: 'benchmark', label: 'Madurez ambiental', icon: 'benchmark' },
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
  /** Which nav item is highlighted as the current page. Omit if the page isn't a menu item (e.g. settings). */
  activeId?: SidebarNavId;
  companyName: string;
  companyRole: string;
  companyInitials: string;
  /** Overrides the default settings bottom-item label. */
  settingsLabel?: string;
  variant?: SidebarNavVariant;
}

export function buildSidebarConfig(options: BuildSidebarConfigOptions): SidebarConfig {
  const { activeId, companyName, companyRole, companyInitials } = options;
  const menuItems: SidebarMenuItem[] = SIDEBAR_NAV_ITEMS[options.variant ?? 'empresa'].map(
    (item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      active: item.id === activeId,
    })
  );

  const bottomItems: SidebarBottomItem[] = options.settingsLabel
    ? SIDEBAR_BOTTOM_ITEMS.map((item) =>
        item.id === 'settings' ? { ...item, label: options.settingsLabel as string } : item
      )
    : [...SIDEBAR_BOTTOM_ITEMS];

  return { menuItems, bottomItems, companyName, companyRole, companyInitials };
}
