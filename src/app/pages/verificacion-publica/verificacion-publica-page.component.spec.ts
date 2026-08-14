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
  categoria: 'CERTIFICACION',
  tipo: 'CARBONO_NEUTRAL',
  nombreCertificacion: 'Carbono Neutral',
  nivelInsignia: null,
  empresa: 'EcoCorp',
  auditor: 'Ana Pérez',
  entidadCertificadora: 'CarbonHub',
  fechaEmision: '2026-01-15T00:00:00Z',
  fechaVencimiento: '2027-01-15',
  fechaRevocacion: null,
  fechaConsulta: '2026-08-01T12:30:00Z',
};

const RESULTADO_INSIGNIA: VerificacionCredencial = {
  estado: 'valida_vigente',
  categoria: 'INSIGNIA',
  tipo: 'INSIGNIA',
  nombreCertificacion: 'Excelencia climática empresarial',
  nivelInsignia: 'oro',
  empresa: 'EcoCorp',
  auditor: null,
  entidadCertificadora: 'CarbonHub',
  fechaEmision: '2026-01-15T00:00:00Z',
  fechaVencimiento: null,
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

  it('el encabezado con icono y titulo se muestra tanto en el formulario como en el resultado', async () => {
    const sinCodigo = await crearFixture();
    expect(
      (sinCodigo.nativeElement as HTMLElement).querySelector('.ch-verificacion-publica__intro')
    ).not.toBeNull();

    const conResultado = await crearFixture('CH-2026-8F4A19KD');
    expect(
      (conResultado.nativeElement as HTMLElement).querySelector('.ch-verificacion-publica__intro')
    ).not.toBeNull();
  });

  it('con codigo en la ruta verifica automaticamente y muestra el estado de carga primero', () => {
    const fixture = TestBed.createComponent(VerificacionPublicaPageComponent);
    fixture.componentRef.setInput('codigo', 'CH-2026-8F4A19KD');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[role="status"]')).not.toBeNull();
    expect(verificar).toHaveBeenCalledWith('CH-2026-8F4A19KD');
  });

  it('normaliza a mayusculas y sin espacios el codigo que llega por la ruta', () => {
    const fixture = TestBed.createComponent(VerificacionPublicaPageComponent);
    fixture.componentRef.setInput('codigo', ' ch-2026-8f4a19kd ');
    fixture.detectChanges();

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

  it('una insignia muestra Nivel y Obtenida en vez de Auditor y Período', async () => {
    verificar.mockReturnValue(of(RESULTADO_INSIGNIA));
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Insignia verificable');
    expect(root.textContent).toContain('Nivel');
    expect(root.textContent).toContain('Oro');
    expect(root.textContent).toContain('Obtenida');
    expect(root.textContent).toContain('Emisor');
    expect(root.textContent).not.toContain('Auditor');
    expect(root.textContent).not.toContain('Período');
  });

  it('una credencial vencida se muestra con variante warning', async () => {
    verificar.mockReturnValue(of({ ...RESULTADO_VIGENTE, estado: 'valida_vencida' }));
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.className).toContain('ch-badge--warning');
    expect(root.textContent).toContain('Credencial válida pero vencida');
  });

  it('una credencial revocada se muestra con variante danger y la nota de revocacion', async () => {
    verificar.mockReturnValue(
      of({ ...RESULTADO_VIGENTE, estado: 'revocada', fechaRevocacion: '2026-06-01T00:00:00Z' })
    );
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.className).toContain('ch-badge--danger');
    expect(root.textContent).toContain('Credencial revocada');
    expect(root.querySelector('app-semantic-card')?.textContent).toContain(
      'Esta credencial fue revocada el'
    );
    expect(root.textContent).toContain('01/06/2026');
    expect(root.textContent).toContain('por la entidad certificadora y ya no es válida');
  });

  it('una credencial vencida resalta en rojo la fecha de vencimiento', async () => {
    verificar.mockReturnValue(of({ ...RESULTADO_VIGENTE, estado: 'valida_vencida' }));
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    const vencida = root.querySelector('.ch-verificacion-publica__mono--vencida');
    expect(vencida?.textContent).toContain('15/01/2027');
  });

  it('una credencial vigente no resalta ninguna fecha en rojo', async () => {
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-verificacion-publica__mono--vencida')).toBeNull();
  });

  it('la etiqueta de estado (app-badge) no lleva icono, solo color', async () => {
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.querySelector('.ch-badge__icon')).toBeNull();
  });

  it('"Verificar otra credencial" es secundario y queda centrado', async () => {
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    const boton = root.querySelector('.ch-verificacion-publica__accion');
    expect(boton?.className).toContain('ch-button--secondary');
  });

  it('todo resultado incluye la marca de tiempo de la consulta en fuente monoespaciada, en la hora local del visitante con am/pm', async () => {
    const fixture = await crearFixture('CH-2026-8F4A19KD');
    const root = fixture.nativeElement as HTMLElement;

    const consulta = root.querySelector('.ch-verificacion-publica__consulta');
    // No se fija una fecha exacta: fechaConsulta se muestra en la hora local
    // de quien visita (no siempre UTC), asi que el dia/hora exactos dependen
    // de la zona horaria de quien corre la prueba.
    expect(consulta?.textContent).toMatch(
      /Consulta: \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} (AM|PM) \(GMT.*\)/
    );
  });

  it('un codigo mal formado o inexistente (404) muestra credencial no encontrada con el codigo consultado', async () => {
    verificar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: {
              status: 404,
              message: 'Credencial no encontrada.',
              timestamp: '2026-08-01T12:30:00Z',
            },
          })
      )
    );
    const fixture = await crearFixture('CH-2026-NOEXISTE');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Credencial no encontrada');
    expect(root.textContent).toContain('CH-2026-NOEXISTE');
    expect(root.textContent).toContain('Verifica que esté escrito correctamente');
    expect(root.querySelector('.ch-verificacion-publica__consulta')?.textContent).toMatch(
      /Consulta: \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} (AM|PM) \(GMT.*\)/
    );
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
