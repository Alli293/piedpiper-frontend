import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Certificacion } from '../../../core/models/certificacion.model';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { CertificacionesService } from '../../../core/services/certificaciones.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CertificacionDetallePageComponent } from './certificacion-detalle-page.component';

const CERTIFICACION_BASE: Certificacion = {
  id: 'cert-1',
  idAuditoria: 'aud-1',
  idEmpresa: 'emp-1',
  idAuditor: 'user-1',
  tipo: 'CARBONO_NEUTRAL',
  nombreCertificacion: 'Carbono Neutral',
  fechaEmision: '2026-01-15T00:00:00Z',
  fechaVencimiento: '2027-01-15',
  estado: 'ACTIVA',
  vigente: true,
  urlVerificacion: 'https://carbonhub.example/api/certificaciones/cert-1/verificar',
  recienEmitida: false,
  codigoVerificacion: 'CH-2026-AAAA1111',
};

describe('CertificacionDetallePageComponent', () => {
  let fixture: ComponentFixture<CertificacionDetallePageComponent>;
  let component: CertificacionDetallePageComponent;
  let certificacionesService: {
    obtener: ReturnType<typeof vi.fn>;
    descargarVerificacionJwt: ReturnType<typeof vi.fn>;
  };
  let toastService: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    certificacionesService = {
      obtener: vi.fn().mockReturnValue(of(CERTIFICACION_BASE)),
      descargarVerificacionJwt: vi
        .fn()
        .mockReturnValue(of(new Blob(['header.payload.signature'], { type: 'application/jwt' }))),
    };
    toastService = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CertificacionDetallePageComponent],
      providers: [
        provideRouter([]),
        { provide: CertificacionesService, useValue: certificacionesService },
        { provide: ToastService, useValue: toastService },
        {
          provide: AuthService,
          useValue: { cerrarSesion: vi.fn(), token: signal<string | null>(null) },
        },
        {
          provide: PerfilInicialService,
          useValue: {
            perfil: () => ({ nombre: 'Ariela', apellidos: 'Jimenez', empresa: null }),
            obtener: () =>
              of({ nombre: 'Ariela', apellidos: 'Jimenez', empresa: null } as PerfilInicial),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificacionDetallePageComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'cert-1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('carga la certificacion por id al iniciar', () => {
    expect(certificacionesService.obtener).toHaveBeenCalledWith('cert-1');
    expect((component as any).certificacion()).toEqual(CERTIFICACION_BASE);
  });

  it('muestra un mensaje de error si la carga falla', async () => {
    certificacionesService.obtener.mockReturnValueOnce(throwError(() => new Error('network')));

    fixture = TestBed.createComponent(CertificacionDetallePageComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'cert-1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((component as any).error()).toBe(true);
    expect(toastService.error).toHaveBeenCalled();
  });

  it('descargar credencial dispara la descarga del blob devuelto por el servicio', async () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await (component as any).descargarVerificacionJwt();

    expect(certificacionesService.descargarVerificacionJwt).toHaveBeenCalledWith('cert-1');
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('compartir en LinkedIn abre una pestaña nueva con la URL correcta', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    (component as any).compartirEnLinkedIn();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target, features] = openSpy.mock.calls[0];
    expect(target).toBe('_blank');
    expect(features).toBe('noopener,noreferrer');

    const params = new URL(url as string).searchParams;
    expect(params.get('name')).toBe('Carbono Neutral');
    expect(params.get('organizationName')).toBe('CarbonHub');
    expect(params.get('certUrl')).toBe(CERTIFICACION_BASE.urlVerificacion);
    expect(params.get('issueYear')).toBe('2026');
    expect(params.get('issueMonth')).toBe('1');
    expect(params.get('expirationYear')).toBe('2027');
    expect(params.get('expirationMonth')).toBe('1');

    openSpy.mockRestore();
  });

  it('buildLinkedInShareUrl arma la URL con los parametros esperados', () => {
    const url = (component as any).buildLinkedInShareUrl(CERTIFICACION_BASE);
    const params = new URL(url).searchParams;

    expect(url.startsWith('https://www.linkedin.com/profile/add?')).toBe(true);
    expect(params.get('name')).toBe('Carbono Neutral');
    expect(params.get('organizationName')).toBe('CarbonHub');
    expect(params.get('certUrl')).toBe(CERTIFICACION_BASE.urlVerificacion);
    expect(params.get('issueYear')).toBe('2026');
    expect(params.get('issueMonth')).toBe('1');
    expect(params.get('expirationYear')).toBe('2027');
    expect(params.get('expirationMonth')).toBe('1');
  });
});
