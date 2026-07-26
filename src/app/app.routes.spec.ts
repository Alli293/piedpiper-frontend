import {
  guardAuditor,
  guardEmpresa,
  guardEmpresaAdmin,
  routes,
  rutasPostAutenticacion,
  usuarioIndividualGuard,
} from './app.routes';
import { authGuard } from './core/auth/auth.guard';

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
      'ecoruta/planificar',
    ];

    for (const path of rutasEcoRuta) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toEqual([usuarioIndividualGuard]);
    }
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
      'empresa/limites',
      'empresa/emisiones',
      'empresa/emisiones/registrar',
    ];
    for (const path of rutasEmpresa) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toContain(guardEmpresa);
    }
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

  it('auditor/validacion-pendiente solo exige sesion iniciada, sin exigir el rol final', () => {
    const ruta = routes.find((r) => r.path === 'auditor/validacion-pendiente');
    expect(ruta?.canActivate).toEqual([authGuard]);
  });

  it('validacion-pendiente generico no exige sesion (se llega ahi antes de tener token)', () => {
    const ruta = routes.find((r) => r.path === 'validacion-pendiente');
    expect(ruta?.canActivate).toBeUndefined();
  });

  it('la ruta publica de certificaciones no exige sesion', () => {
    const ruta = routes.find((r) => r.path === 'empresa/:slug/reputacion/certificaciones');
    expect(ruta).toBeDefined();
    expect(ruta?.canActivate).toBeUndefined();
  });
});
