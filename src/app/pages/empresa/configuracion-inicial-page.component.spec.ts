import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ConfiguracionInicialPageComponent } from './configuracion-inicial-page.component';
import { EmpresaService } from '../../core/empresa/empresa.service';

describe('ConfiguracionInicialPageComponent', () => {
  let empresaService: { completarConfiguracionEmpresa: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    empresaService = { completarConfiguracionEmpresa: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfiguracionInicialPageComponent],
      providers: [provideRouter([]), { provide: EmpresaService, useValue: empresaService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  function createFixture() {
    const fixture = TestBed.createComponent(ConfiguracionInicialPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function setInputValue(root: HTMLElement, selector: string, value: string): void {
    const element = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  function setSelectValue(root: HTMLElement, index: number, value: string): void {
    const selects = root.querySelectorAll<HTMLSelectElement>('select');
    const element = selects[index];
    if (!element) throw new Error(`Select not found at index ${index}`);
    element.value = value;
    element.dispatchEvent(new Event('change'));
  }

  function fillValidForm(root: HTMLElement): void {
    setInputValue(root, 'input[placeholder="Café del Valle S.A."]', 'Café del Valle S.A.');
    setSelectValue(root, 0, 'AGROINDUSTRIA');
    setSelectValue(root, 1, 'CR');
    setInputValue(root, 'input[placeholder="25"]', '12');
    setInputValue(root, 'input[placeholder="3-101-123456"]', '3-101-123456');
    setInputValue(
      root,
      'textarea[placeholder="Cuéntanos brevemente a qué se dedica tu empresa..."]',
      'Producción y exportación de café.'
    );
  }

  async function submitForm(fixture: ReturnType<typeof createFixture>): Promise<void> {
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  it('se crea', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('con campos vacios muestra el error de cada campo simultaneamente, no solo el primero', async () => {
    const fixture = createFixture();

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorNombreEmpresa()).toContain('nombre legal');
    expect(comp.errorCedulaJuridica()).toContain('Formato de cédula jurídica inválido');
    expect(comp.errorSectorIndustrial()).toContain('Selecciona una opción válida');
    expect(comp.errorCantidadEmpleados()).toContain('mayor que 0');
    expect(empresaService.completarConfiguracionEmpresa).not.toHaveBeenCalled();
  });

  it('con cedula juridica en formato invalido muestra error y no llama al backend', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setInputValue(root, 'input[placeholder="3-101-123456"]', '3101123456');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorCedulaJuridica()).toContain('Formato de cédula jurídica inválido');
    expect(empresaService.completarConfiguracionEmpresa).not.toHaveBeenCalled();
  });

  it('con cantidad de empleados en 0 muestra error y no llama al backend', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setInputValue(root, 'input[placeholder="25"]', '0');

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorCantidadEmpleados()).toContain('mayor que 0');
    expect(empresaService.completarConfiguracionEmpresa).not.toHaveBeenCalled();
  });

  it('con descripcion mayor a 300 caracteres muestra error y no llama al backend', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);
    setInputValue(
      root,
      'textarea[placeholder="Cuéntanos brevemente a qué se dedica tu empresa..."]',
      'a'.repeat(301)
    );

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.errorDescripcion()).toContain('300 caracteres');
    expect(empresaService.completarConfiguracionEmpresa).not.toHaveBeenCalled();
  });

  it('con datos validos llama al servicio con el payload correcto y muestra pantalla de exito sin navegar todavia', async () => {
    empresaService.completarConfiguracionEmpresa.mockReturnValue(
      of({
        empresaId: 'a1b2c3',
        nombreEmpresa: 'Café del Valle S.A.',
        slug: 'cafe-del-valle-sa',
        documentosPendientes: true,
        recienCreada: true,
      })
    );

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(empresaService.completarConfiguracionEmpresa).toHaveBeenCalledWith({
      nombreEmpresa: 'Café del Valle S.A.',
      cedulaJuridica: '3-101-123456',
      sectorIndustrial: 'AGROINDUSTRIA',
      pais: 'CR',
      cantidadEmpleados: 12,
      descripcion: 'Producción y exportación de café.',
    });
    expect(comp.enviado()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('continuar() navega al hacer click explicito en el boton', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance as any;

    comp.continuar();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/empresa/panel');
  });

  it('continuar() loguea el error si la navegacion falla', () => {
    (router.navigateByUrl as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fallo'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const fixture = createFixture();
    const comp = fixture.componentInstance as any;

    comp.continuar();

    return Promise.resolve().then(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al navegar tras completar configuración inicial:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  it('con recienCreada false igual muestra exito, no error (usuario ya habia completado este paso)', async () => {
    empresaService.completarConfiguracionEmpresa.mockReturnValue(
      of({
        empresaId: 'a1b2c3',
        nombreEmpresa: 'Café del Valle S.A.',
        slug: 'cafe-del-valle-sa',
        documentosPendientes: true,
        recienCreada: false,
      })
    );

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.enviado()).toBe(true);
    expect(comp.error()).toBe('');
  });

  it('si el backend responde error, lo muestra y no marca como enviado', async () => {
    empresaService.completarConfiguracionEmpresa.mockReturnValue(
      throwError(() => ({ error: { message: 'Ya existe una empresa con esta cédula jurídica.' } }))
    );

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    fillValidForm(root);

    await submitForm(fixture);

    const comp = fixture.componentInstance as any;
    expect(comp.error()).toBe('Ya existe una empresa con esta cédula jurídica.');
    expect(comp.enviado()).toBe(false);
  });
});
