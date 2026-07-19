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

  it('verificarCorreo hace GET a /auth/verificar-correo con el token como query param', () => {
    let recibida: { mensaje: string } | undefined;
    service.verificarCorreo('tok-123').subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/verificar-correo?token=tok-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ mensaje: 'Tu correo fue verificado. Ya puedes iniciar sesión.' });

    expect(recibida!.mensaje).toBe('Tu correo fue verificado. Ya puedes iniciar sesión.');
  });

  it('verificarCorreo no guarda ningun token en localStorage', () => {
    service.verificarCorreo('tok-123').subscribe();

    const req = httpMock.expectOne(`${base}/verificar-correo?token=tok-123`);
    req.flush({ mensaje: 'OK' });

    expect(localStorage.getItem('carbonhub.token')).toBeNull();
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
});

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
