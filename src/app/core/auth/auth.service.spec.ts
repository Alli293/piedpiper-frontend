import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { PerfilInicialService } from '../services/perfil-inicial.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storage: Storage;
  const base = `${environment.apiBaseUrl}/auth`;

  const respuesta = {
    token: 'jwt-app',
    rol: 'USUARIO_INDIVIDUAL',
    estado: 'ACTIVO',
    redirect: '/panel',
  };

  beforeEach(() => {
    storage = createStorageMock();
    vi.stubGlobal('sessionStorage', storage);
    vi.stubGlobal('localStorage', createStorageMock());
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.unstubAllGlobals();
  });

  it('loginConCorreo hace POST a /auth/login con metodo CORREO y guarda el token', () => {
    let recibida;
    service.loginConCorreo('a@b.com', 'secreta').subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ metodo: 'CORREO', email: 'a@b.com', contrasena: 'secreta' });
    req.flush(respuesta);

    expect(recibida!.token).toBe('jwt-app');
    expect(sessionStorage.getItem('carbonhub.token')).toBe('jwt-app');
    expect(service.token()).toBe('jwt-app');
  });

  it('loginConGoogle hace POST con metodo GOOGLE e idToken', () => {
    service.loginConGoogle('id-token').subscribe();

    const req = httpMock.expectOne(`${base}/login`);
    expect(req.request.body).toEqual({ metodo: 'GOOGLE', idToken: 'id-token' });
    req.flush(respuesta);
  });

  it('registrarConGoogle apunta al endpoint del tipo con aceptaTerminos en true', () => {
    service.registrarConGoogle('empresa', 'id-token').subscribe();

    const req = httpMock.expectOne(`${base}/registro/empresa`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idToken: 'id-token', aceptaTerminos: true });
    req.flush({
      ...respuesta,
      rol: 'ADMINISTRADOR_EMPRESA',
      redirect: '/empresa/configuracion-inicial',
    });

    expect(sessionStorage.getItem('carbonhub.token')).toBe('jwt-app');
  });

  it('solicitarResetContrasena hace POST a /auth/solicitar-reset-contrasena y no guarda token', () => {
    let recibida: { mensaje: string } | undefined;
    service.solicitarResetContrasena('ana.perez@example.com').subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/solicitar-reset-contrasena`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana.perez@example.com' });
    req.flush({
      mensaje:
        'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.',
    });

    expect(recibida!.mensaje).toContain('Si existe una cuenta');
    expect(sessionStorage.getItem('carbonhub.token')).toBeNull();
  });

  it('validarTokenReset hace POST y mantiene el token fuera de la URL', () => {
    let recibida: { email: string } | undefined;
    service.validarTokenReset('tok-123').subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/reset-contrasena/validar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok-123' });
    req.flush({ email: 'ana.perez@example.com' });

    expect(recibida!.email).toBe('ana.perez@example.com');
  });

  it('restablecerContrasena hace POST a /auth/restablecer-contrasena con token y contrasenas, sin guardar token', () => {
    let recibida: { mensaje: string } | undefined;
    service
      .restablecerContrasena('tok-123', 'Clave1234!', 'Clave1234!')
      .subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/restablecer-contrasena`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      token: 'tok-123',
      nuevaContrasena: 'Clave1234!',
      confirmarContrasena: 'Clave1234!',
    });
    req.flush({ mensaje: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.' });

    expect(recibida!.mensaje).toContain('actualizada');
    expect(sessionStorage.getItem('carbonhub.token')).toBeNull();
  });

  it('registrarInvitacionConCorreo hace POST con tokenInvitacion junto a los datos y guarda el token', () => {
    let recibida;
    service
      .registrarInvitacionConCorreo('token-inv', {
        nombre: 'Ana',
        apellidos: 'Torres',
        contrasena: 'clave1234',
        confirmarContrasena: 'clave1234',
        aceptaTerminos: true,
      })
      .subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/registro/invitacion/correo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      tokenInvitacion: 'token-inv',
      nombre: 'Ana',
      apellidos: 'Torres',
      contrasena: 'clave1234',
      confirmarContrasena: 'clave1234',
      aceptaTerminos: true,
    });
    req.flush({ ...respuesta, rol: 'USUARIO_GENERAL', redirect: '/perfil/configuracion-inicial' });

    expect(recibida!.redirect).toBe('/perfil/configuracion-inicial');
    expect(sessionStorage.getItem('carbonhub.token')).toBe('jwt-app');
    expect(service.token()).toBe('jwt-app');
  });

  it('verificarCorreo hace POST y mantiene el token fuera de la URL', () => {
    let recibida: { mensaje: string } | undefined;
    service.verificarCorreo('tok-123').subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/verificar-correo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok-123' });
    req.flush({ mensaje: 'Tu correo fue verificado. Ya puedes iniciar sesión.' });

    expect(recibida!.mensaje).toBe('Tu correo fue verificado. Ya puedes iniciar sesión.');
  });

  it('verificarCorreo no guarda ningun token en sessionStorage', () => {
    service.verificarCorreo('tok-123').subscribe();

    const req = httpMock.expectOne(`${base}/verificar-correo`);
    req.flush({ mensaje: 'OK' });

    expect(sessionStorage.getItem('carbonhub.token')).toBeNull();
  });

  it('reenviarVerificacion hace POST a /auth/reenviar-verificacion con el email', () => {
    let recibida: { mensaje: string } | undefined;
    service.reenviarVerificacion('ana@correo.com').subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/reenviar-verificacion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@correo.com' });
    req.flush({ mensaje: 'Si tu cuenta requiere verificación, te enviamos un nuevo enlace.' });

    expect(recibida!.mensaje).toBe(
      'Si tu cuenta requiere verificación, te enviamos un nuevo enlace.'
    );
  });

  it('cerrarSesion limpia el token', () => {
    sessionStorage.setItem('carbonhub.token', 'x');
    service.cerrarSesion();
    expect(sessionStorage.getItem('carbonhub.token')).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('cerrarSesion limpia el perfil cacheado para que la siguiente sesión no herede datos', () => {
    const perfilInicialService = TestBed.inject(PerfilInicialService);
    const limpiarCache = vi.spyOn(perfilInicialService, 'limpiarCache');

    service.cerrarSesion();

    expect(limpiarCache).toHaveBeenCalled();
  });

  it('loginConCorreo limpia el perfil cacheado de una sesión anterior', () => {
    const perfilInicialService = TestBed.inject(PerfilInicialService);
    const limpiarCache = vi.spyOn(perfilInicialService, 'limpiarCache');

    service.loginConCorreo('otra@empresa.com', 'secreta').subscribe();
    httpMock.expectOne(`${base}/login`).flush(respuesta);

    expect(limpiarCache).toHaveBeenCalled();
  });

  it('renovarToken actualiza el token almacenado y la señal', () => {
    service.renovarToken('jwt-renovado');
    expect(sessionStorage.getItem('carbonhub.token')).toBe('jwt-renovado');
    expect(service.token()).toBe('jwt-renovado');
  });

  it('registrarAuditorCorreo hace POST a /auth/registro/auditor/correo con los datos del formulario', () => {
    const body = {
      nombre: 'Carlos',
      apellidos: 'Lopez',
      email: 'carlos@example.com',
      contrasena: 'segura123',
      aceptaTerminos: true,
    };

    let recibida: { mensaje: string; email: string } | undefined;
    service.registrarAuditorCorreo(body).subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/registro/auditor/correo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ mensaje: 'Registro exitoso.', email: 'carlos@example.com' });

    expect(recibida!.email).toBe('carlos@example.com');
  });

  it('registrarAuditorCorreo no guarda token en sessionStorage', () => {
    service
      .registrarAuditorCorreo({
        nombre: 'Ana',
        apellidos: 'Mora',
        email: 'ana@example.com',
        contrasena: 'clave123',
        aceptaTerminos: true,
      })
      .subscribe();

    const req = httpMock.expectOne(`${base}/registro/auditor/correo`);
    req.flush({ mensaje: 'OK', email: 'ana@example.com' });

    expect(sessionStorage.getItem('carbonhub.token')).toBeNull();
  });

  it('rol deriva el claim rol del token JWT', () => {
    service.loginConCorreo('admin@carbonhub.cr', 'secreta').subscribe();

    const req = httpMock.expectOne(`${base}/login`);
    req.flush({ ...respuesta, token: jwtConRol('ADMINISTRADOR_PLATAFORMA') });

    expect(service.rol()).toBe('ADMINISTRADOR_PLATAFORMA');
  });

  it('rol es null cuando no hay token o el token es invalido', () => {
    expect(service.rol()).toBeNull();

    service.loginConCorreo('a@b.com', 'secreta').subscribe();
    httpMock.expectOne(`${base}/login`).flush({ ...respuesta, token: 'no-es-un-jwt' });

    expect(service.rol()).toBeNull();
  });

  it('estado y configuracionCompleta derivan sus claims del token JWT', () => {
    service.loginConCorreo('auditor@carbonhub.cr', 'secreta').subscribe();

    const req = httpMock.expectOne(`${base}/login`);
    req.flush({
      ...respuesta,
      token: jwtConClaims({
        rol: 'AUDITOR_CERTIFICADO',
        estado: 'PENDIENTE_VALIDACION',
        configuracionCompleta: false,
      }),
    });

    expect(service.estado()).toBe('PENDIENTE_VALIDACION');
    expect(service.configuracionCompleta()).toBe(false);
  });

  it('configuracionCompleta es false por defecto cuando no hay token', () => {
    expect(service.configuracionCompleta()).toBe(false);
    expect(service.estado()).toBeNull();
  });
});

function jwtConRol(rol: string): string {
  return jwtConClaims({ rol });
}

function jwtConClaims(claims: Record<string, unknown>): string {
  const payload = btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `encabezado.${payload}.firma`;
}

function createStorageMock(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}
