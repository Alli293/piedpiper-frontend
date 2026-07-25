import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';
import { InvitacionesPageComponent } from './invitaciones-page.component';
import { Invitacion, InvitacionesService } from '../../../core/invitaciones/invitaciones.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';

describe('InvitacionesPageComponent', () => {
  let toastService: ToastService;
  let invitacionesService: {
    emitir: ReturnType<typeof vi.fn>;
    listar: ReturnType<typeof vi.fn>;
    revocar: ReturnType<typeof vi.fn>;
  };

  const invitacion: Invitacion = {
    id: 'inv-1',
    email: 'colab@correo.com',
    estado: 'ENVIADA',
    fechaEmision: '2026-07-14T00:00:00Z',
    fechaExpiracion: '2026-07-21T00:00:00Z',
  };

  beforeEach(async () => {
    invitacionesService = {
      emitir: vi.fn(),
      listar: vi.fn().mockReturnValue(of([invitacion])),
      revocar: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InvitacionesPageComponent],
      providers: [
        ToastService,
        { provide: InvitacionesService, useValue: invitacionesService },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();

    toastService = TestBed.inject(ToastService);
  });

  function crear() {
    const fixture = TestBed.createComponent(InvitacionesPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function ultimoToast() {
    const toasts = toastService.toasts();
    return toasts[toasts.length - 1];
  }

  it('pinta la lista con el estado de cada invitacion', () => {
    const fixture = crear();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.textContent).toContain('colab@correo.com');
    expect(html.textContent).toContain('Enviada');
  });

  it('con correo invalido muestra el error del formulario y no llama al backend', async () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.model.set({ email: 'no-es-correo' });

    await comp.enviar();
    fixture.detectChanges();

    expect(invitacionesService.emitir).not.toHaveBeenCalled();
    expect(comp.emailError()).toBe('Ingresa un correo electrónico válido.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Ingresa un correo electrónico válido.'
    );
  });

  it('con correo valido emite la invitacion, la agrega a la lista y muestra el toast', async () => {
    invitacionesService.emitir.mockReturnValue(
      of({ ...invitacion, id: 'inv-2', email: 'nueva@correo.com' })
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.model.set({ email: '  nueva@correo.com  ' });

    await comp.enviar();

    expect(invitacionesService.emitir).toHaveBeenCalledWith('nueva@correo.com');
    expect(comp.invitaciones()).toHaveLength(2);
    expect(comp.model().email).toBe('');
    expect(ultimoToast()).toMatchObject({
      variant: 'success',
      title: 'Invitación enviada a nueva@correo.com.',
    });
  });

  it('un 409 del backend muestra el mensaje de la API en un toast de error', async () => {
    invitacionesService.emitir.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Ya existe una invitación pendiente para este correo.' },
          })
      )
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.model.set({ email: 'colab@correo.com' });

    await comp.enviar();

    expect(ultimoToast()).toMatchObject({
      variant: 'error',
      title: 'Ya existe una invitación pendiente para este correo.',
    });
  });

  it('si falla la carga inicial muestra el error y no el estado vacio', () => {
    invitacionesService.listar.mockReturnValue(throwError(() => ({ status: 500 })));
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    const html = fixture.nativeElement as HTMLElement;

    expect(comp.errorCarga()).toBe(true);
    expect(html.textContent).toContain('No pudimos cargar las invitaciones. Intenta nuevamente.');
    expect(html.textContent).not.toContain('Aún no has enviado invitaciones.');
  });

  it('reintentar vuelve a pedir las invitaciones tras un fallo de carga', () => {
    invitacionesService.listar.mockReturnValueOnce(throwError(() => ({ status: 500 })));
    const fixture = crear();
    const comp = fixture.componentInstance as any;

    invitacionesService.listar.mockReturnValue(of([invitacion]));
    comp.reintentarCarga();
    fixture.detectChanges();

    expect(comp.errorCarga()).toBe(false);
    expect(comp.invitaciones()).toHaveLength(1);
  });

  it('el modal de revocacion se cierra con Escape', () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.abrirRevocacion(invitacion);
    fixture.detectChanges();
    const modal = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="dialog"]'
    ) as HTMLElement;

    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(comp.invitacionARevocar()).toBeNull();
  });

  it('muestra el modal de revocacion y revoca al confirmar', () => {
    invitacionesService.revocar.mockReturnValue(of({ ...invitacion, estado: 'REVOCADA' }));
    const fixture = crear();
    const comp = fixture.componentInstance as any;

    comp.abrirRevocacion(invitacion);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeTruthy();

    comp.confirmarRevocacion();

    expect(invitacionesService.revocar).toHaveBeenCalledWith('inv-1');
    expect(comp.invitaciones()[0].estado).toBe('REVOCADA');
    expect(comp.invitacionARevocar()).toBeNull();
    expect(ultimoToast()).toMatchObject({
      variant: 'success',
      title: 'Invitación a colab@correo.com revocada.',
    });
  });
});
