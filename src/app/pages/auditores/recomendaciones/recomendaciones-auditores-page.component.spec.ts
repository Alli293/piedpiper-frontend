import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthSessionService } from '../../../core/auth-session.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuditoresService } from '../auditores.service';
import { AuditorRecomendado, RecomendacionAuditores } from '../auditor.model';
import { RecomendacionesAuditoresPageComponent } from './recomendaciones-auditores-page.component';

describe('RecomendacionesAuditoresPageComponent', () => {
  let fixture: ComponentFixture<RecomendacionesAuditoresPageComponent>;
  let component: RecomendacionesAuditoresPageComponent;
  let auditoresService: {
    recomendar: ReturnType<typeof vi.fn>;
    obtenerEspecialidades: ReturnType<typeof vi.fn>;
    obtenerZonas: ReturnType<typeof vi.fn>;
  };

  const auditorBase: AuditorRecomendado = {
    auditorId: 'aud-1',
    nombre: 'Ana Mora',
    fotoPerfil: null,
    especialidades: ['Manufactura'],
    calificacionPromedio: 4.8,
    disponible: true,
    auditoriasCompletadas: 12,
    justificacion: 'Tiene experiencia en manufactura y buena calificación.',
  };

  async function montar(respuesta?: RecomendacionAuditores | { error: unknown }) {
    const recomendar =
      respuesta && 'error' in respuesta
        ? vi.fn().mockReturnValue(throwError(() => respuesta.error))
        : vi
            .fn()
            .mockReturnValue(
              of(respuesta ?? { recomendaciones: [auditorBase], iaDisponible: true })
            );

    auditoresService = {
      recomendar,
      obtenerEspecialidades: vi
        .fn()
        .mockReturnValue(of([{ valor: 'MANUFACTURA', etiqueta: 'Manufactura' }])),
      obtenerZonas: vi.fn().mockReturnValue(of([{ valor: 'SAN_JOSE', etiqueta: 'San José' }])),
    };

    await TestBed.configureTestingModule({
      imports: [RecomendacionesAuditoresPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuditoresService, useValue: auditoresService },
        {
          provide: AuthSessionService,
          useValue: {
            getRole: vi.fn().mockReturnValue('administrador_empresa'),
            getUserName: vi.fn().mockReturnValue('Mock User'),
            isAdministradorEmpresa: vi.fn().mockReturnValue(true),
          },
        },
        {
          provide: AuthService,
          useValue: { cerrarSesion: vi.fn(), token: signal<string | null>(null) },
        },
        {
          provide: ToastService,
          useValue: { error: vi.fn(), success: vi.fn(), toasts: signal([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecomendacionesAuditoresPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function comp() {
    return component as unknown as {
      model: { set(v: unknown): void };
      handleSubmit(evento: Event): void;
      recomendaciones(): AuditorRecomendado[];
      iaDisponible(): boolean;
      sinResultados(): boolean;
      avisoIaNoDisponible(): boolean;
      error(): string | null;
    };
  }

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function buscarCon(valores: Record<string, unknown>) {
    comp().model.set({
      tipoAuditoria: 'MANUFACTURA',
      especialidadBuscada: 'MANUFACTURA',
      zonaGeografica: 'SAN_JOSE',
      soloDisponibles: true,
      ...valores,
    });
    fixture.detectChanges();
    comp().handleSubmit(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /**
   * La historia lo pide explícitamente: mientras se generan las recomendaciones se muestra un
   * spinner y el botón queda deshabilitado. Sin eso, dos clics seguidos disparan dos búsquedas y
   * la segunda respuesta puede pisar a la primera.
   */
  it('mientras carga muestra el spinner y deshabilita el botón', async () => {
    await montar();
    const enVuelo = new Subject<RecomendacionAuditores>();
    auditoresService.recomendar.mockReturnValue(enVuelo);

    comp().model.set({
      tipoAuditoria: 'MANUFACTURA',
      especialidadBuscada: 'MANUFACTURA',
      zonaGeografica: 'SAN_JOSE',
      soloDisponibles: true,
    });
    fixture.detectChanges();
    comp().handleSubmit(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    const boton = raiz().querySelector<HTMLButtonElement>('button[type=submit]');
    expect(boton?.disabled).toBe(true);
    expect(raiz().querySelector('.ch-recomendaciones__estado')?.textContent).toContain(
      'Buscando auditores'
    );

    enVuelo.next({ recomendaciones: [auditorBase], iaDisponible: true });
    enVuelo.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(raiz().querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(false);
    expect(raiz().querySelector('.ch-recomendaciones__estado')).toBeNull();
  });

  it('al entrar carga los catálogos de especialidades y zonas', async () => {
    await montar();

    expect(auditoresService.obtenerEspecialidades).toHaveBeenCalled();
    expect(auditoresService.obtenerZonas).toHaveBeenCalled();
  });

  /** Nada más entrar no puede aparecer el mensaje de "no encontramos auditores". */
  it('no muestra el estado sin resultados antes de la primera búsqueda', async () => {
    await montar();

    expect(comp().sinResultados()).toBe(false);
    expect(raiz().querySelector('.ch-recomendaciones__vacio')).toBeNull();
  });

  it('envía los filtros al servicio y pinta una tarjeta por candidato', async () => {
    await montar();

    await buscarCon({});

    expect(auditoresService.recomendar).toHaveBeenCalledWith({
      tipoAuditoria: 'MANUFACTURA',
      especialidadBuscada: 'MANUFACTURA',
      zonaGeografica: 'SAN_JOSE',
      soloDisponibles: true,
    });
    expect(raiz().querySelectorAll('.ch-recomendaciones__tarjeta')).toHaveLength(1);
    expect(raiz().textContent).toContain('Ana Mora');
  });

  it('muestra la justificación cuando la IA la generó', async () => {
    await montar();

    await buscarCon({});

    expect(raiz().querySelector('.ch-recomendaciones__justificacion')?.textContent).toContain(
      'experiencia en manufactura'
    );
  });

  /**
   * Degradación controlada: sin justificación la tarjeta sigue en pantalla, con el nombre y el
   * botón al perfil. Si desapareciera, un fallo de IA dejaría al usuario sin candidatos.
   */
  it('si la justificación es nula muestra la tarjeta sin ese bloque', async () => {
    await montar({
      recomendaciones: [{ ...auditorBase, justificacion: null }],
      iaDisponible: false,
    });

    await buscarCon({});

    expect(raiz().querySelectorAll('.ch-recomendaciones__tarjeta')).toHaveLength(1);
    expect(raiz().querySelector('.ch-recomendaciones__justificacion')).toBeNull();
    expect(raiz().textContent).toContain('Ana Mora');
  });

  it('avisa que las justificaciones de IA no están disponibles', async () => {
    await montar({
      recomendaciones: [{ ...auditorBase, justificacion: null }],
      iaDisponible: false,
    });

    await buscarCon({});

    expect(comp().avisoIaNoDisponible()).toBe(true);
    expect(raiz().querySelector('.ch-recomendaciones__aviso-ia')?.textContent).toContain(
      'no están disponibles'
    );
  });

  /** Con candidatos y justificaciones el aviso no puede aparecer. */
  it('no muestra el aviso de IA cuando las justificaciones sí llegaron', async () => {
    await montar();

    await buscarCon({});

    expect(comp().avisoIaNoDisponible()).toBe(false);
    expect(raiz().querySelector('.ch-recomendaciones__aviso-ia')).toBeNull();
  });

  it('sin candidatos muestra el mensaje y el botón Explorar directorio', async () => {
    await montar({ recomendaciones: [], iaDisponible: true });

    await buscarCon({});

    expect(comp().sinResultados()).toBe(true);
    const vacio = raiz().querySelector('.ch-recomendaciones__vacio');
    expect(vacio?.textContent).toContain('No encontramos auditores');
    expect(vacio?.textContent).toContain('Explorar directorio');
  });

  /** Sin candidatos la IA no falló, así que el aviso de IA no corresponde. */
  it('sin candidatos no muestra ademas el aviso de IA no disponible', async () => {
    await montar({ recomendaciones: [], iaDisponible: true });

    await buscarCon({});

    expect(raiz().querySelector('.ch-recomendaciones__aviso-ia')).toBeNull();
  });

  it('un campo obligatorio vacío no llama al servicio y marca el error inline', async () => {
    await montar();

    await buscarCon({ tipoAuditoria: '' });

    expect(auditoresService.recomendar).not.toHaveBeenCalled();
    expect(raiz().textContent).toContain('Este campo es obligatorio.');
  });

  it('si el servidor falla muestra el error y no deja tarjetas viejas en pantalla', async () => {
    await montar();
    await buscarCon({});
    expect(raiz().querySelectorAll('.ch-recomendaciones__tarjeta')).toHaveLength(1);

    auditoresService.recomendar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    await buscarCon({});

    expect(comp().error()).toBe('No se pudieron cargar las recomendaciones. Intente nuevamente.');
    expect(raiz().querySelectorAll('.ch-recomendaciones__tarjeta')).toHaveLength(0);
    expect(comp().sinResultados()).toBe(false);
  });

  it('respeta la bandera de solo disponibles cuando se desmarca', async () => {
    await montar();

    await buscarCon({ soloDisponibles: false });

    expect(auditoresService.recomendar).toHaveBeenCalledWith(
      expect.objectContaining({ soloDisponibles: false })
    );
  });
});
