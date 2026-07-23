import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ImaPanelComponent } from './ima-panel.component';
import { ImaResponse } from './ima.service';

describe('ImaPanelComponent', () => {
  let componentRef: ComponentRef<ImaPanelComponent>;
  let fixture: ComponentFixture<ImaPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ImaPanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(ImaPanelComponent);
    componentRef = fixture.componentRef;
  });

  it('muestra carga cuando ima es null', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.ima-card__loading')).toBeTruthy();
  });

  it('muestra puntajes cuando IMA completo', () => {
    componentRef.setInput('ima', imaCompleto());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ima-gauge__value')?.textContent?.trim()).toBe('71');
  });

  it('muestra N/A cuando puntaje intensidad sectorial es null', () => {
    componentRef.setInput('ima', imaParcial());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const naElement = el.querySelector('.ima-dim__score--na');
    expect(naElement).toBeTruthy();
    expect(naElement?.textContent?.trim()).toBe('N/A');
  });

  it('muestra aviso cuando parcial', () => {
    componentRef.setInput('ima', imaParcial());
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.ima-card__notice')).toBeTruthy();
  });

  it('no muestra aviso cuando completo', () => {
    componentRef.setInput('ima', imaCompleto());
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.ima-card__notice')).toBeFalsy();
  });

  // Validates: Requirements 5.1
  it('muestra interpretación y siguiente paso cuando ambos son válidos', () => {
    const ima = imaCompleto();
    ima.interpretacion = 'Tu empresa muestra buen desempeño ambiental frente al sector.';
    ima.siguientePaso = 'Incrementar la cobertura de registros en categoría transporte.';
    componentRef.setInput('ima', ima);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const iaSection = el.querySelector('.ima-card__ia-section');
    expect(iaSection).toBeTruthy();

    const iaTexts = el.querySelectorAll('.ima-card__ia-text');
    expect(iaTexts.length).toBe(2);
    expect(iaTexts[0].textContent?.trim()).toBe(
      'Tu empresa muestra buen desempeño ambiental frente al sector.'
    );
    expect(iaTexts[1].textContent?.trim()).toBe(
      'Incrementar la cobertura de registros en categoría transporte.'
    );
  });

  // Validates: Requirements 5.2
  it('muestra aviso estático cuando interpretacion es "No disponible"', () => {
    const ima = imaCompleto();
    ima.interpretacion = 'No disponible';
    ima.siguientePaso = 'No disponible';
    componentRef.setInput('ima', ima);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const unavailable = el.querySelector('.ima-card__ia-unavailable');
    expect(unavailable).toBeTruthy();
    expect(unavailable?.textContent?.trim()).toBe(
      'La interpretación con IA no está disponible en este momento.'
    );
    expect(el.querySelector('.ima-card__ia-section')).toBeFalsy();
  });

  // Validates: Requirements 5.2
  it('muestra aviso estático cuando solo siguientePaso es "No disponible"', () => {
    const ima = imaCompleto();
    ima.interpretacion = 'Texto válido de interpretación.';
    ima.siguientePaso = 'No disponible';
    componentRef.setInput('ima', ima);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ima-card__ia-unavailable')).toBeTruthy();
    expect(el.querySelector('.ima-card__ia-section')).toBeFalsy();
  });

  // Validates: Requirements 5.4
  it('emite periodoChange al llamar onMesChange', () => {
    componentRef.setInput('ima', imaCompleto());
    componentRef.setInput('anio', 2025);
    fixture.detectChanges();

    let emitted: { anio: number; mes: number } | undefined;
    fixture.componentInstance.periodoChange.subscribe((v) => (emitted = v));

    (fixture.componentInstance as any).onMesChange('3');

    expect(emitted).toEqual({ anio: 2025, mes: 3 });
  });

  function imaCompleto(): ImaResponse {
    return {
      cobertura: 75,
      puntajeIntensidadSectorial: 58,
      consistencia: 80,
      ima: 71,
      parcial: false,
      motivoParcial: null,
      intensidad: 1.5,
      calculatedAt: '2026-07-18T00:00:00Z',
      interpretacion: null,
      siguientePaso: null,
    };
  }

  function imaParcial(): ImaResponse {
    return {
      cobertura: 50,
      puntajeIntensidadSectorial: null,
      consistencia: 25,
      ima: 37.5,
      parcial: true,
      motivoParcial: 'Tu sector no tiene suficientes empresas.',
      intensidad: null,
      calculatedAt: '2026-01-18T00:00:00Z',
      interpretacion: null,
      siguientePaso: null,
    };
  }
});
