import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/auth`;

  const respuesta = {
    token: 'jwt-app',
    rol: 'USUARIO_INDIVIDUAL',
    estado: 'ACTIVO',
    redirect: '/panel',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

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

  it('cerrarSesion limpia el token', () => {
    localStorage.setItem('carbonhub.token', 'x');
    service.cerrarSesion();
    expect(localStorage.getItem('carbonhub.token')).toBeNull();
    expect(service.token()).toBeNull();
  });
});
