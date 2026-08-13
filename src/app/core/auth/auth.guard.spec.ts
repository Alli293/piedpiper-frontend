import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard, guardAuditorActivo, noAuthGuard, rolGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let authService: { token: ReturnType<typeof signal<string | null>> };
  let router: Router;

  beforeEach(() => {
    authService = { token: signal<string | null>(null) };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  function ejecutarGuard() {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }

  it('permite el acceso cuando hay token', () => {
    authService.token.set('jwt-123');

    expect(ejecutarGuard()).toBe(true);
  });

  it('redirige a /login cuando no hay token', () => {
    const resultado = ejecutarGuard();

    expect(resultado).toEqual(router.parseUrl('/login'));
  });
});

describe('rolGuard', () => {
  let authService: {
    token: ReturnType<typeof signal<string | null>>;
    rol: ReturnType<typeof signal<string | null>>;
  };
  let router: Router;

  beforeEach(() => {
    authService = { token: signal<string | null>(null), rol: signal<string | null>(null) };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  function ejecutarGuard() {
    return TestBed.runInInjectionContext(() =>
      rolGuard('ADMINISTRADOR_PLATAFORMA')({} as any, {} as any)
    );
  }

  it('permite el acceso cuando el rol coincide', () => {
    authService.token.set('jwt-123');
    authService.rol.set('ADMINISTRADOR_PLATAFORMA');

    expect(ejecutarGuard()).toBe(true);
  });

  it('redirige a la pantalla de inicio del propio rol cuando el rol no coincide', () => {
    authService.token.set('jwt-123');
    authService.rol.set('ADMINISTRADOR_EMPRESA');

    expect(ejecutarGuard()).toEqual(router.parseUrl('empresa/panel'));
  });

  it('redirige a /login cuando no hay token', () => {
    expect(ejecutarGuard()).toEqual(router.parseUrl('/login'));
  });

  it('redirige a /login cuando el rol del token no es reconocido', () => {
    authService.token.set('jwt-123');
    authService.rol.set('ROL_INEXISTENTE');

    expect(ejecutarGuard()).toEqual(router.parseUrl('/login'));
  });

  it('permite el acceso cuando el rol coincide con alguno de varios roles permitidos', () => {
    authService.token.set('jwt-123');
    authService.rol.set('USUARIO_GENERAL');

    const resultado = TestBed.runInInjectionContext(() =>
      rolGuard('ADMINISTRADOR_EMPRESA', 'USUARIO_GENERAL')({} as any, {} as any)
    );

    expect(resultado).toBe(true);
  });
});

describe('guardAuditorActivo', () => {
  let authService: {
    rol: ReturnType<typeof signal<string | null>>;
    estado: ReturnType<typeof signal<string | null>>;
    configuracionCompleta: ReturnType<typeof signal<boolean>>;
  };
  let router: Router;

  beforeEach(() => {
    authService = {
      rol: signal<string | null>('AUDITOR_CERTIFICADO'),
      estado: signal<string | null>(null),
      configuracionCompleta: signal(false),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  function ejecutarGuard() {
    return TestBed.runInInjectionContext(() => guardAuditorActivo({} as any, {} as any));
  }

  it('permite el acceso cuando el estado es ACTIVO', () => {
    authService.estado.set('ACTIVO');

    expect(ejecutarGuard()).toBe(true);
  });

  it('sin configuracion inicial completa redirige a completarla', () => {
    authService.estado.set('PENDIENTE_VALIDACION');
    authService.configuracionCompleta.set(false);

    expect(ejecutarGuard()).toEqual(router.parseUrl('/auditor/configuracion-inicial'));
  });

  it('con configuracion inicial completa pero sin aprobar redirige a la pantalla de espera', () => {
    authService.estado.set('PENDIENTE_VALIDACION');
    authService.configuracionCompleta.set(true);

    expect(ejecutarGuard()).toEqual(router.parseUrl('/auditor/validacion-pendiente'));
  });

  it('con solicitud rechazada tambien redirige a la pantalla de espera, que muestra el rechazo', () => {
    authService.estado.set('RECHAZADO');
    authService.configuracionCompleta.set(true);

    expect(ejecutarGuard()).toEqual(router.parseUrl('/auditor/validacion-pendiente'));
  });

  /**
   * Un JWT emitido antes de que estos claims existieran (sesion iniciada previa al deploy) no
   * trae `estado` ni `configuracionCompleta`; AuthService los deja en sus valores por defecto
   * (null / false) hasta que el interceptor de refresh los actualice en la siguiente llamada
   * HTTP. La guarda se evalua antes de eso, asi que un auditor ya ACTIVO con token viejo rebota
   * una vez a configuracion-inicial. Documentado como limitacion conocida, no como bug: el mismo
   * camino que "sin configuracion inicial completa", solo que llegando por token viejo en vez de
   * por PENDIENTE_VALIDACION explicito.
   */
  it('con claims por defecto (token emitido antes del deploy) redirige a completar configuracion', () => {
    authService.estado.set(null);
    authService.configuracionCompleta.set(false);

    expect(ejecutarGuard()).toEqual(router.parseUrl('/auditor/configuracion-inicial'));
  });

  /**
   * `guardDetalleAuditoria` comparte `empresa/auditorias/:id` y `auditor/auditorias/:id` entre
   * empresa, auditor y administrador de plataforma, y le agrega esta guarda para cerrar la
   * ventana del auditor no-activo. Si no se ignorara a si misma para los otros roles, una empresa
   * o un administrador (sin claim `estado` en su JWT) quedarian rebotados a pantallas de
   * onboarding de auditor que no les corresponden.
   */
  it('ignora el chequeo de estado cuando el rol activo no es auditor', () => {
    authService.rol.set('ADMINISTRADOR_EMPRESA');
    authService.estado.set(null);
    authService.configuracionCompleta.set(false);

    expect(ejecutarGuard()).toBe(true);
  });
});

describe('noAuthGuard', () => {
  let authService: {
    token: ReturnType<typeof signal<string | null>>;
    rol: ReturnType<typeof signal<string | null>>;
  };
  let router: Router;

  beforeEach(() => {
    authService = { token: signal<string | null>(null), rol: signal<string | null>(null) };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  function ejecutarGuard() {
    return TestBed.runInInjectionContext(() => noAuthGuard({} as any, {} as any));
  }

  it('permite el acceso cuando no hay token', () => {
    expect(ejecutarGuard()).toBe(true);
  });

  it('redirige a la pantalla de inicio del rol cuando ya hay una sesión válida', () => {
    authService.token.set('jwt-123');
    authService.rol.set('ADMINISTRADOR_EMPRESA');

    expect(ejecutarGuard()).toEqual(router.parseUrl('empresa/panel'));
  });

  it('redirige a la raíz cuando hay token pero el rol no es reconocido', () => {
    authService.token.set('jwt-123');
    authService.rol.set('ROL_INEXISTENTE');

    expect(ejecutarGuard()).toEqual(router.parseUrl('/'));
  });
});
