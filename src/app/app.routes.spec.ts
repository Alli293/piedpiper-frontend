import { routes, rutasPostAutenticacion, usuarioIndividualGuard } from './app.routes';
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

  it('las paginas privadas generales estan protegidas con authGuard', () => {
    const rutasPrivadas = [
      'benchmark',
      'configuracion',
      'empresa/configuracion-inicial',
      'perfil/configuracion-inicial',
    ];

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
});
