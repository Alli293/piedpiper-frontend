import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';
import { VerificacionCredencial } from './verificacion-publica.models';
import { VerificacionPublicaService } from './verificacion-publica.service';
import { VerificacionPublicaPageComponent } from './verificacion-publica-page.component';

const RESULTADO_VIGENTE: VerificacionCredencial = {
  estado: 'valida_vigente',
  tipo: 'CARBONO_NEUTRAL',
  nombreCertificacion: 'Carbono Neutral',
  empresa: 'EcoCorp',
  auditor: 'Ana Pérez',
  entidadCertificadora: 'CarbonHub',
  fechaEmision: '2026-01-15T00:00:00Z',
  fechaVencimiento: '2027-01-15',
  fechaRevocacion: null,
  fechaConsulta: '2026-08-01T12:30:00Z',
};

describe('VerificacionPublicaPageComponent', () => {
  let verificar: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    verificar = vi.fn().mockReturnValue(of(RESULTADO_VIGENTE));
    toastError = vi.fn();

    await TestBed.configureTestingModule({
      imports: [VerificacionPublicaPageComponent],
      providers: [
        provideRouter([]),
        { provide: VerificacionPublicaService, useValue: { verificar } },
        { provide: ToastService, useValue: { error: toastError } },
      ],
    }).compileComponents();
  });

  async function crearFixture(
    codigo?: string
  ): Promise<ComponentFixture<VerificacionPublicaPageComponent>> {
    const fixture = TestBed.createComponent(VerificacionPublicaPageComponent);
    if (codigo !== undefined) {
      fixture.componentRef.setInput('codigo', codigo);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('sin codigo en la ruta muestra el formulario y no llama al servicio', async () => {
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('form')).not.toBeNull();
    expect(verificar).not.toHaveBeenCalled();
  });

  it('con codigo en la ruta verifica automaticamente y muestra el estado de carga primero', () => {
    const fixture = TestBed.createComponent(VerificacionPublicaPageComponent);
    fixture.componentRef.setInput('codigo', 'CH-2026-8F4A19KD');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[role="status"]')).not.toBeNull();
    expect(verificar).toHaveBeenCalledWith('CH-2026-8F4A19KD');
  });

  it('una credencial vigente se muestra con variante success', async () => {
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.className).toContain('ch-badge--success');
    expect(root.textContent).toContain('Credencial válida y vigente');
    expect(root.textContent).toContain('EcoCorp');
    expect(root.textContent).toContain('CarbonHub');
  });

  it('una credencial vencida se muestra con variante warning', async () => {
    verificar.mockReturnValue(of({ ...RESULTADO_VIGENTE, estado: 'valida_vencida' }));
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.className).toContain('ch-badge--warning');
    expect(root.textContent).toContain('Credencial válida pero vencida');
  });

  it('una credencial revocada se muestra con variante danger y su fecha de revocacion', async () => {
    verificar.mockReturnValue(
      of({ ...RESULTADO_VIGENTE, estado: 'revocada', fechaRevocacion: '2026-06-01T00:00:00Z' })
    );
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.className).toContain('ch-badge--danger');
    expect(root.textContent).toContain('Credencial revocada');
    expect(root.textContent).toContain('Fecha de revocación');
  });

  it('un codigo mal formado o inexistente (404) muestra credencial no encontrada', async () => {
    verificar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const fixture = await crearFixture('CH-2026-NOEXISTE');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Credencial no encontrada');
    expect(toastError).not.toHaveBeenCalled();
  });

  it('un error 500 muestra el estado de error y dispara un toast', async () => {
    verificar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('No fue posible verificar esta credencial');
    expect(toastError).toHaveBeenCalledWith(
      'El servicio de verificación no está disponible en este momento. Intenta más tarde.'
    );
  });

  it('reintentar vuelve a invocar el servicio tras un error', async () => {
    verificar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    verificar.mockReturnValue(of(RESULTADO_VIGENTE));
    const reintentar = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Reintentar')
    );
    reintentar?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(verificar).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain('Credencial válida y vigente');
  });

  it('"Verificar otro código" navega a /verificar sin parametro', async () => {
    verificar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const fixture = await crearFixture('CH-2026-NOEXISTE');
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;

    const boton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Verificar otro código')
    );
    boton?.click();

    expect(navegar).toHaveBeenCalledWith('/verificar');
  });

  function escribirCodigo(root: HTMLElement, valor: string): void {
    const input = root.querySelector<HTMLInputElement>('.ch-text-input__field');
    if (!input) throw new Error('No se encontro el input de codigo.');
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  it('el formulario rechaza un codigo con formato invalido sin llamar al servicio', async () => {
    const fixture = await crearFixture();
    const root = fixture.nativeElement as HTMLElement;
    escribirCodigo(root, 'no-valido');

    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(verificar).not.toHaveBeenCalled();
    expect(root.textContent).toContain('El código no tiene un formato válido.');
  });

  it('el formulario con un codigo valido navega a /verificar/:codigo en mayusculas', async () => {
    const fixture = await crearFixture();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;
    escribirCodigo(root, 'ch-2026-8f4a19kd');

    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(navegar).toHaveBeenCalledWith(['/verificar', 'CH-2026-8F4A19KD']);
  });
});
