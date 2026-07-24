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

  it('muestra interpretacion IA cuando presente', () => {
    const ima = imaCompleto();
    ima.interpretacionIa = 'Tu empresa muestra buen desempeño ambiental.';
    componentRef.setInput('ima', ima);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const interpretation = el.querySelector('.ima-card__interpretation');
    expect(interpretation).toBeTruthy();
    expect(interpretation?.textContent?.trim()).toBe(
      'Tu empresa muestra buen desempeño ambiental.'
    );
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
      interpretacionIa: null,
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
      interpretacionIa: null,
    };
  }
});
