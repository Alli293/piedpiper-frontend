import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
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
    vi.stubGlobal('localStorage', storage);
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
    expect(localStorage.getItem('carbonhub.token')).toBe('jwt-app');
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

    expect(localStorage.getItem('carbonhub.token')).toBe('jwt-app');
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
    expect(localStorage.getItem('carbonhub.token')).toBeNull();
  });

  it('validarTokenReset hace GET a /auth/reset-contrasena con el token como query param', () => {
    let recibida: { email: string } | undefined;
    service.validarTokenReset('tok-123').subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/reset-contrasena?token=tok-123`);
    expect(req.request.method).toBe('GET');
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
    expect(localStorage.getItem('carbonhub.token')).toBeNull();
  });

  it('cerrarSesion limpia el token', () => {
    localStorage.setItem('carbonhub.token', 'x');
    service.cerrarSesion();
    expect(localStorage.getItem('carbonhub.token')).toBeNull();
    expect(service.token()).toBeNull();
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

  it('registrarAuditorCorreo no guarda token en localStorage', () => {
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

    expect(localStorage.getItem('carbonhub.token')).toBeNull();
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
});

function jwtConRol(rol: string): string {
  const payload = btoa(JSON.stringify({ rol }))
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
