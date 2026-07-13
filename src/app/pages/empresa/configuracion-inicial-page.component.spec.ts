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

  function llenarFormularioValido(comp: any): void {
    comp.nombreEmpresa.set('Café del Valle S.A.');
    comp.cedulaJuridica.set('3-101-123456');
    comp.sectorIndustrial.set('AGROINDUSTRIA');
    comp.pais.set('CR');
    comp.cantidadEmpleados.set('12');
    comp.descripcion.set('Producción y exportación de café.');
  }

  it('se crea', () => {
    const fixture = TestBed.createComponent(ConfiguracionInicialPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('con nombreEmpresa vacio muestra error y no llama al backend', () => {
    const fixture = TestBed.createComponent(ConfiguracionInicialPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.enviar(new Event('submit'));

    expect(comp.errorNombreEmpresa()).toContain('nombre legal');
    expect(empresaService.completarConfiguracionEmpresa).not.toHaveBeenCalled();
  });

  it('con cedula juridica en formato invalido muestra error y no llama al backend', () => {
    const fixture = TestBed.createComponent(ConfiguracionInicialPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);
    comp.cedulaJuridica.set('3101123456');

    comp.enviar(new Event('submit'));

    expect(comp.errorCedulaJuridica()).toContain('Formato de cédula jurídica inválido');
    expect(empresaService.completarConfiguracionEmpresa).not.toHaveBeenCalled();
  });

  it('con cantidad de empleados en 0 muestra error y no llama al backend', () => {
    const fixture = TestBed.createComponent(ConfiguracionInicialPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);
    comp.cantidadEmpleados.set('0');

    comp.enviar(new Event('submit'));

    expect(comp.errorCantidadEmpleados()).toContain('mayor que 0');
    expect(empresaService.completarConfiguracionEmpresa).not.toHaveBeenCalled();
  });

  it('con descripcion mayor a 300 caracteres muestra error y no llama al backend', () => {
    const fixture = TestBed.createComponent(ConfiguracionInicialPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);
    comp.descripcion.set('a'.repeat(301));

    comp.enviar(new Event('submit'));

    expect(comp.errorDescripcion()).toContain('300 caracteres');
    expect(empresaService.completarConfiguracionEmpresa).not.toHaveBeenCalled();
  });

  it('con datos validos llama al servicio con el payload correcto y navega', () => {
    empresaService.completarConfiguracionEmpresa.mockReturnValue(
      of({
        empresaId: 'a1b2c3',
        nombreEmpresa: 'Café del Valle S.A.',
        slug: 'cafe-del-valle-sa',
        documentosPendientes: true,
        recienCreada: true,
      })
    );

    const fixture = TestBed.createComponent(ConfiguracionInicialPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);

    comp.enviar(new Event('submit'));

    expect(empresaService.completarConfiguracionEmpresa).toHaveBeenCalledWith({
      nombreEmpresa: 'Café del Valle S.A.',
      cedulaJuridica: '3-101-123456',
      sectorIndustrial: 'AGROINDUSTRIA',
      pais: 'CR',
      cantidadEmpleados: 12,
      descripcion: 'Producción y exportación de café.',
    });
    expect(comp.enviado()).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('con recienCreada false igual muestra exito, no error (usuario ya habia completado este paso)', () => {
    empresaService.completarConfiguracionEmpresa.mockReturnValue(
      of({
        empresaId: 'a1b2c3',
        nombreEmpresa: 'Café del Valle S.A.',
        slug: 'cafe-del-valle-sa',
        documentosPendientes: true,
        recienCreada: false,
      })
    );

    const fixture = TestBed.createComponent(ConfiguracionInicialPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);

    comp.enviar(new Event('submit'));

    expect(comp.enviado()).toBe(true);
    expect(comp.error()).toBe('');
  });

  it('si el backend responde error, lo muestra y no marca como enviado', () => {
    empresaService.completarConfiguracionEmpresa.mockReturnValue(
      throwError(() => ({ error: { message: 'Ya existe una empresa con esta cédula jurídica.' } }))
    );

    const fixture = TestBed.createComponent(ConfiguracionInicialPageComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    llenarFormularioValido(comp);

    comp.enviar(new Event('submit'));

    expect(comp.error()).toBe('Ya existe una empresa con esta cédula jurídica.');
    expect(comp.enviado()).toBe(false);
  });
});
