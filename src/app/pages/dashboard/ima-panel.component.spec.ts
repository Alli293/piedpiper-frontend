import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ImaPanelComponent } from './ima-panel.component';
import { ImaResponse } from './ima.service';

describe('ImaPanelComponent', () => {
  let componentRef: ComponentRef<ImaPanelComponent>;
  let fixture: ComponentFixture<ImaPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImaPanelComponent],
    }).compileComponents();
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

  // Validates: Requirements 5.1 (now rendered in dashboard, not ima-panel)
  // IA interpretation section tests moved to dashboard-page.component.spec.ts

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
