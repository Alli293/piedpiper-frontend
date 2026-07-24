import { routes, rutasPostAutenticacion } from './app.routes';
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

  it('las páginas privadas están protegidas con authGuard', () => {
    const rutasPrivadas = [
      'benchmark',
      'configuracion',
      'ecoruta/insignias',
      'ecoruta/itinerarios',
      'ecoruta/planificar',
      'empresa/configuracion-inicial',
      'perfil/configuracion-inicial',
    ];
    for (const path of rutasPrivadas) {
      const ruta = routes.find((r) => r.path === path);
      expect(ruta?.canActivate).toContain(authGuard);
    }
  });
});
