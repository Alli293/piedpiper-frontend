import { SidebarBottomItem, SidebarMenuItem } from '../../components/sidebar/sidebar.component';
import { IconName } from '../../components/icon/icon.component';

/**
 * Única fuente de verdad para la navegación lateral de las páginas autenticadas.
 *
 * Las páginas NO deben reconstruir su propio SidebarConfig: solo declaran cuál
 * ítem está activo (via `activeId`) y ShellLayoutComponent arma el resto.
 * Para agregar una entrada al menú, edítela aquí y en ningún otro lugar.
 */

/** Ids válidos del menú principal. Cada uno debe tener una ruta real en `app.routes.ts`. */
export type SidebarNavId = 'dashboard' | 'emissions' | 'benchmark';

interface SidebarNavItem {
  readonly id: SidebarNavId;
  readonly label: string;
  readonly icon: IconName;
}

/**
 * Ítems del menú principal. El orden aquí es el orden en que se muestran.
 * Solo se incluyen entradas con una ruta navegable existente; no se inventan
 * destinos que aún no existen en la app.
 */
export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'emissions', label: 'Mis Emisiones', icon: 'emisiones' },
  { id: 'benchmark', label: 'Madurez ambiental', icon: 'benchmark' },
];

/** Ítems fijos del pie de la barra lateral (no participan del estado "activo"). */
export const SIDEBAR_BOTTOM_ITEMS: readonly SidebarBottomItem[] = [
  { id: 'settings', label: 'Configuración', icon: 'config' },
  { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
];

/**
 * Datos de la empresa mostrados en la barra lateral.
 * Mock temporal hasta conectar con la sesión real del usuario.
 */
export const COMPANY_NAME = 'Café del Valle S.A.';
export const COMPANY_ROLE = 'Empresa · Admin';
export const COMPANY_INITIALS = 'CV';

/**
 * Construye la lista de ítems del menú marcando como activo el `activeId` dado.
 * Es la única forma soportada de obtener los `SidebarMenuItem`.
 */
export function buildSidebarMenuItems(activeId: SidebarNavId): SidebarMenuItem[] {
  return SIDEBAR_NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: item.id === activeId,
  }));
}
