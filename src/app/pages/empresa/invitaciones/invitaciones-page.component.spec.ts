import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InvitacionesPageComponent } from './invitaciones-page.component';
import { Invitacion, InvitacionesService } from '../../../core/invitaciones/invitaciones.service';

describe('InvitacionesPageComponent', () => {
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
      providers: [{ provide: InvitacionesService, useValue: invitacionesService }],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(InvitacionesPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('pinta la lista con el estado de cada invitacion', () => {
    const fixture = crear();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.textContent).toContain('colab@correo.com');
    expect(html.textContent).toContain('Enviada');
  });

  it('con correo invalido muestra el error inline y no llama al backend', () => {
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.email.set('no-es-correo');

    comp.enviar(new Event('submit'));

    expect(comp.errorEmail()).toBe('Ingresa un correo electrónico válido');
    expect(invitacionesService.emitir).not.toHaveBeenCalled();
  });

  it('con correo valido emite la invitacion y la agrega a la lista', () => {
    invitacionesService.emitir.mockReturnValue(
      of({ ...invitacion, id: 'inv-2', email: 'nueva@correo.com' })
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.email.set('nueva@correo.com');

    comp.enviar(new Event('submit'));

    expect(invitacionesService.emitir).toHaveBeenCalledWith('nueva@correo.com');
    expect(comp.invitaciones()).toHaveLength(2);
    expect(comp.mensajeExito()).toContain('nueva@correo.com');
  });

  it('un 409 del backend muestra el mensaje del error', () => {
    invitacionesService.emitir.mockReturnValue(
      throwError(() => ({
        error: { message: 'Ya existe una invitación pendiente para este correo.' },
      }))
    );
    const fixture = crear();
    const comp = fixture.componentInstance as any;
    comp.email.set('colab@correo.com');

    comp.enviar(new Event('submit'));

    expect(comp.mensajeError()).toBe('Ya existe una invitación pendiente para este correo.');
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
  });
});
