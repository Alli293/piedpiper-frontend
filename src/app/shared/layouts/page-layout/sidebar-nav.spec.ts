import { buildAuditorSidebarConfig, buildSidebarConfig } from './sidebar-nav';

describe('buildSidebarConfig', () => {
  const base = {
    companyName: 'Acme S.A.',
    companyRole: 'Administrador',
    companyInitials: 'AC',
  };

  it('incluye los items de empresa por defecto sin colaboradores para no administradores', () => {
    const config = buildSidebarConfig(base);

    expect(config.menuItems.map((item) => item.id)).toEqual([
      'dashboard',
      'emissions',
      'benchmark',
    ]);
  });

  it('incluye colaboradores cuando esAdministradorEmpresa es true', () => {
    const config = buildSidebarConfig({ ...base, esAdministradorEmpresa: true });

    expect(config.menuItems.map((item) => item.id)).toContain('colaboradores');
  });

  it('marca como activo el item cuyo id coincide con activeId', () => {
    const config = buildSidebarConfig({ ...base, activeId: 'emissions' });

    const activos = config.menuItems.filter((item) => item.active).map((item) => item.id);
    expect(activos).toEqual(['emissions']);
  });

  it('usa los items de ecoruta cuando variant es ecoruta', () => {
    const config = buildSidebarConfig({ ...base, variant: 'ecoruta' });

    expect(config.menuItems.map((item) => item.id)).toEqual([
      'ecoruta-planificar',
      'ecoruta-itinerarios',
      'ecoruta-insignias',
    ]);
  });

  it('sobrescribe la etiqueta de configuración cuando se provee settingsLabel', () => {
    const config = buildSidebarConfig({ ...base, settingsLabel: 'Ajustes de empresa' });

    const settings = config.bottomItems.find((item) => item.id === 'settings');
    expect(settings?.label).toBe('Ajustes de empresa');
  });

  it('conserva el nombre, rol e iniciales recibidos', () => {
    const config = buildSidebarConfig(base);

    expect(config.companyName).toBe('Acme S.A.');
    expect(config.companyRole).toBe('Administrador');
    expect(config.companyInitials).toBe('AC');
  });
});

describe('buildAuditorSidebarConfig', () => {
  it('incluye los items del auditor con auditorías deshabilitada', () => {
    const config = buildAuditorSidebarConfig({
      auditorName: 'Ana Mora',
      auditorInitials: 'AM',
    });

    const auditorias = config.menuItems.find((item) => item.id === 'auditorias');
    expect(auditorias?.disabled).toBe(true);
    expect(config.companyRole).toBe('Auditor · Verificado');
  });

  it('marca como activo el item indicado en activeId', () => {
    const config = buildAuditorSidebarConfig({
      activeId: 'perfil-publico',
      auditorName: 'Ana Mora',
      auditorInitials: 'AM',
    });

    const activos = config.menuItems.filter((item) => item.active).map((item) => item.id);
    expect(activos).toEqual(['perfil-publico']);
  });

  it('sobrescribe la etiqueta de configuración cuando se provee settingsLabel', () => {
    const config = buildAuditorSidebarConfig({
      auditorName: 'Ana Mora',
      auditorInitials: 'AM',
      settingsLabel: 'Mi cuenta',
    });

    const settings = config.bottomItems.find((item) => item.id === 'settings');
    expect(settings?.label).toBe('Mi cuenta');
  });
});
