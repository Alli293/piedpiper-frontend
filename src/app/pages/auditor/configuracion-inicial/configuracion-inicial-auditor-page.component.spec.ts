import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ConfiguracionInicialAuditorPageComponent } from './configuracion-inicial-auditor-page.component';
import { PerfilAuditorService } from '../../../core/perfil-auditor/perfil-auditor.service';
import { ConfiguracionInicialAuditorService } from '../../../core/auditor/configuracion-inicial-auditor.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('ConfiguracionInicialAuditorPageComponent', () => {
  let fixture: ComponentFixture<ConfiguracionInicialAuditorPageComponent>;
  let component: ConfiguracionInicialAuditorPageComponent;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  let perfilAuditorService: { obtenerEspecialidades: ReturnType<typeof vi.fn> };
  let configuracionInicialAuditorService: { completar: ReturnType<typeof vi.fn> };

  const especialidades = [
    { valor: 'AGROINDUSTRIA', etiqueta: 'Agroindustria' },
    { valor: 'MANUFACTURA', etiqueta: 'Manufactura' },
  ];

  function interno() {
    return component as unknown as {
      model: {
        (): { aniosExperiencia: string; sitioWeb: string; descripcionProfesional: string };
        set(v: {
          aniosExperiencia: string;
          sitioWeb: string;
          descripcionProfesional: string;
        }): void;
      };
      documentos: { set(files: File[]): void };
      toggleEspecialidad(valor: string): void;
      errorGeneral(): string;
    };
  }

  function pdf(nombre: string): File {
    return new File(['%PDF-1.7 contenido'], nombre, { type: 'application/pdf' });
  }

  beforeEach(async () => {
    perfilAuditorService = { obtenerEspecialidades: vi.fn().mockReturnValue(of(especialidades)) };
    configuracionInicialAuditorService = {
      completar: vi.fn().mockReturnValue(of({ mensaje: 'Recibimos tu información.' })),
    };

    await TestBed.configureTestingModule({
      imports: [ConfiguracionInicialAuditorPageComponent],
      providers: [
        provideRouter([]),
        { provide: PerfilAuditorService, useValue: perfilAuditorService },
        {
          provide: ConfiguracionInicialAuditorService,
          useValue: configuracionInicialAuditorService,
        },
        ToastService,
      ],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(ConfiguracionInicialAuditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('carga el catálogo de especialidades', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('Agroindustria');
    expect(texto).toContain('Manufactura');
  });

  it('sin especialidades ni documentos no envía la solicitud', async () => {
    interno().model.set({ aniosExperiencia: '5', sitioWeb: '', descripcionProfesional: '' });
    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(configuracionInicialAuditorService.completar).not.toHaveBeenCalled();
  });

  it('envía la configuración inicial y navega a la pantalla de espera', async () => {
    interno().model.set({ aniosExperiencia: '5', sitioWeb: '', descripcionProfesional: '' });
    interno().toggleEspecialidad('AGROINDUSTRIA');
    interno().documentos.set([pdf('certificado.pdf')]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(configuracionInicialAuditorService.completar).toHaveBeenCalledWith(
      {
        aniosExperiencia: 5,
        especialidades: ['AGROINDUSTRIA'],
        descripcionProfesional: null,
        sitioWeb: null,
      },
      [expect.any(File)]
    );
    expect(navigateByUrl).toHaveBeenCalledWith('/auditor/validacion-pendiente');
  });

  it('muestra el error del backend si falla el envío', async () => {
    configuracionInicialAuditorService.completar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Ya completaste tu configuración inicial.' },
          })
      )
    );
    interno().model.set({ aniosExperiencia: '5', sitioWeb: '', descripcionProfesional: '' });
    interno().toggleEspecialidad('AGROINDUSTRIA');
    interno().documentos.set([pdf('certificado.pdf')]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(interno().errorGeneral()).toBe('Ya completaste tu configuración inicial.');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('no permite seleccionar mas de MAX_ESPECIALIDADES y deshabilita el resto de opciones', async () => {
    const muchasEspecialidades = Array.from({ length: 9 }, (_, i) => ({
      valor: `ESP_${i}`,
      etiqueta: `Especialidad ${i}`,
    }));
    perfilAuditorService.obtenerEspecialidades.mockReturnValue(of(muchasEspecialidades));
    fixture = TestBed.createComponent(ConfiguracionInicialAuditorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    for (let i = 0; i < 9; i++) {
      interno().toggleEspecialidad(`ESP_${i}`);
    }
    fixture.detectChanges();

    const seleccionadas = (
      component as unknown as { especialidadesSeleccionadas: () => string[] }
    ).especialidadesSeleccionadas();
    expect(seleccionadas.length).toBe(8);
    expect(seleccionadas).not.toContain('ESP_8');

    const checkboxes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('input[type="checkbox"]')
    ) as HTMLInputElement[];
    expect(checkboxes[8].disabled).toBe(true);
  });
});
