import {
  guardAuditor,
  guardEmpresa,
  guardEmpresaAdmin,
  guardDirectorioAuditores,
  guardAdmin,
  routes,
  rutasPostAutenticacion,
  usuarioIndividualGuard,
} from './app.routes';
import { authGuard, guardAuditorActivo } from './core/auth/auth.guard';

describe('app.routes', () => {
  const redirectsBackend = [
    '/panel',
    '/empresa/configuracion-inicial',
    '/empresa/panel',
    '/auditor/configuracion-inicial',
    '/auditor/panel',
    '/auditor/validacion-pendiente',
    '/perfil/configuracion-inicial',
    '/admin/panel',
  ];

  it('define una ruta para cada redirect de post autenticacion del backend', () => {
    const paths = new Set(routes.map((ruta) => `/${ruta.path}`));
    for (const destino of redirectsBackend) {
      expect(paths.has(destino)).toBe(true);
    }
  });

  it('todas las rutas post autenticacion cargan un componente', () => {
    for (const path of rutasPostAutenticacion) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.loadComponent).toBeTypeOf('function');
    }
  });

  it('las páginas privadas compartidas están protegidas con authGuard', () => {
    const rutasPrivadas = ['configuracion', 'perfil/configuracion-inicial'];
    for (const path of rutasPrivadas) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toContain(authGuard);
    }
  });

  it('las paginas de EcoRuta son exclusivas de usuario individual', () => {
    const rutasEcoRuta = [
      'ecoruta',
      'ecoruta/preferencias',
      'ecoruta/insignias',
      'ecoruta/itinerarios',
      'ecoruta/itinerarios/:id',
    ];

    for (const path of rutasEcoRuta) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toEqual([usuarioIndividualGuard]);
    }
  });

  /**
   * El backend manda al administrador de plataforma acá al iniciar sesión. Era un placeholder sin
   * navegación: entraba a una pantalla vacía y no podía moverse. Mientras no exista un panel
   * propio, redirige a la única pantalla de administración construida.
   */
  it('admin/panel redirige a la pantalla de solicitudes de auditor', () => {
    const ruta = routes.find((r) => r.path === 'admin/panel');
    expect(ruta?.redirectTo).toBe('admin/solicitudes-auditor');
  });

  it('/panel redirige a la ruta canonica empresa/panel', () => {
    const ruta = routes.find((r) => r.path === 'panel');
    expect(ruta?.redirectTo).toBe('empresa/panel');
  });

  it('las rutas de empresa están protegidas para administrador y usuario general', () => {
    const rutasEmpresa = [
      'empresa/configuracion-inicial',
      'empresa/panel',
      'empresa/benchmark',
      'empresa/certificaciones',
      'empresa/insignias',
      'empresa/limites',
      'empresa/emisiones',
      'empresa/emisiones/registrar',
    ];
    for (const path of rutasEmpresa) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toContain(guardEmpresa);
    }
  });

  it('la asignacion de auditor carga su pagina y solo permite administrador de empresa', () => {
    const ruta = routes.find((r) => r.path === 'empresa/auditorias/:id/auditor');
    expect(ruta?.canActivate).toContain(guardEmpresaAdmin);
    expect(ruta?.loadComponent).toBeTypeOf('function');
  });

  it('empresa/invitaciones solo permite administrador de empresa', () => {
    const ruta = routes.find((r) => r.path === 'empresa/invitaciones');
    expect(ruta?.canActivate).toContain(guardEmpresaAdmin);
  });

  it('las rutas de auditor están protegidas para auditor certificado', () => {
    const rutasAuditor = ['auditor/configuracion-inicial', 'auditor/panel'];
    for (const path of rutasAuditor) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toContain(guardAuditor);
    }
  });

  it('el directorio de auditores solo admite los roles autorizados por el backend', () => {
    for (const path of ['auditores', 'auditores/:id']) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toEqual([guardDirectorioAuditores]);
    }
  });

  it('ui-kit no queda expuesto sin rol de administrador de plataforma', () => {
    const ruta = routes.find((r) => r.path === 'ui-kit');
    expect(ruta?.canActivate).toEqual([guardAdmin]);
  });

  /**
   * El rol de auditor viaja en el JWT desde el registro, antes de que el administrador lo
   * apruebe. guardAuditor por si solo dejaria pasar a un auditor PENDIENTE_VALIDACION a estas
   * pantallas de negocio real; guardAuditorActivo cierra esa ventana exigiendo ademas
   * estado === ACTIVO.
   */
  it('las pantallas de negocio del auditor exigen ademas estado activo', () => {
    const rutasNegocioAuditor = ['auditor/auditorias', 'auditor/perfil'];
    for (const path of rutasNegocioAuditor) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toContain(guardAuditorActivo);
    }
  });

  /**
   * El detalle de auditoria es negocio real del auditor (acepta/rechaza, sube el reporte), y la
   * ruta la comparten empresa/auditor/admin via guardDetalleAuditoria. Sin guardAuditorActivo acá,
   * un auditor PENDIENTE_VALIDACION o RECHAZADO podia entrar por cualquiera de las dos URLs sin
   * pasar por su onboarding.
   */
  it('el detalle de auditoria exige estado activo para el auditor, en ambas rutas', () => {
    const rutasDetalleAuditoria = ['empresa/auditorias/:id', 'auditor/auditorias/:id'];
    for (const path of rutasDetalleAuditoria) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toContain(guardAuditorActivo);
    }
  });

  it('auditor/validacion-pendiente solo exige sesion iniciada, sin exigir el rol final', () => {
    const ruta = routes.find((r) => r.path === 'auditor/validacion-pendiente');
    expect(ruta?.canActivate).toEqual([authGuard]);
  });

  it('validacion-pendiente generico no exige sesion (se llega ahi antes de tener token)', () => {
    const ruta = routes.find((r) => r.path === 'validacion-pendiente');
    expect(ruta?.canActivate).toBeUndefined();
  });

  it('la ruta publica del hub de perfil publico no exige sesion', () => {
    const ruta = routes.find((r) => r.path === 'empresa/:slug/reputacion');
    expect(ruta).toBeDefined();
    expect(ruta?.canActivate).toBeUndefined();
    expect(ruta?.loadComponent).toBeTypeOf('function');
  });

  it('la ruta publica de certificaciones no exige sesion', () => {
    const ruta = routes.find((r) => r.path === 'empresa/:slug/reputacion/certificaciones');
    expect(ruta).toBeDefined();
    expect(ruta?.canActivate).toBeUndefined();
  });

  it('la ruta publica de insignias no exige sesion', () => {
    const ruta = routes.find((r) => r.path === 'empresa/:slug/reputacion/insignias');
    expect(ruta).toBeDefined();
    expect(ruta?.canActivate).toBeUndefined();
  });
});
