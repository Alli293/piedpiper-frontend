import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecomendacionRenovacion } from '../dashboard/dashboard.model';
import { RecomendacionRenovacionPanelComponent } from './recomendacion-renovacion-panel.component';

describe('RecomendacionRenovacionPanelComponent', () => {
  let fixture: ComponentFixture<RecomendacionRenovacionPanelComponent>;

  const RECOMENDACION: RecomendacionRenovacion = {
    idCertificacion: 'c1',
    nombreCertificacion: 'GHG Protocol — Corporate Standard',
    fechaVencimiento: '2026-07-03',
    diasRestantes: 5,
    impactoHuellaT: 120.5,
    justificacion: 'Vence en 5 días y respalda 3 de tus insignias activas.',
    sugerenciaAccion: 'Renovarla ahora evita perder tu nivel Oro.',
  };

  async function createFixture(): Promise<ComponentFixture<RecomendacionRenovacionPanelComponent>> {
    await TestBed.configureTestingModule({
      imports: [RecomendacionRenovacionPanelComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const created = TestBed.createComponent(RecomendacionRenovacionPanelComponent);
    created.detectChanges();
    return created;
  }

  it('muestra el bloque con la certificación prioritaria destacada', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('recomendacion', RECOMENDACION);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-recomendacion-panel__cert strong')?.textContent).toContain(
      'GHG Protocol — Corporate Standard'
    );
    expect(el.querySelector('.ch-recomendacion-panel__texto')?.textContent).toContain(
      'Vence en 5 días y respalda 3 de tus insignias activas.'
    );
  });

  it('muestra el mensaje de no disponibilidad cuando justificacion es nulo', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('recomendacion', {
      ...RECOMENDACION,
      justificacion: null,
      sugerenciaAccion: null,
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(
      el.querySelector('.ch-recomendacion-panel__texto--no-disponible')?.textContent
    ).toContain('No fue posible generar la recomendación en este momento');
    // La certificación prioritaria se sigue mostrando aunque falle la IA.
    expect(el.querySelector('.ch-recomendacion-panel__cert strong')?.textContent).toContain(
      'GHG Protocol — Corporate Standard'
    );
  });

  it('muestra un mensaje explicando cuándo aparecerán recomendaciones cuando no hay alertas activas', async () => {
    fixture = await createFixture();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-recomendacion-panel__header')).toBeTruthy();
    expect(el.querySelector('.ch-recomendacion-panel__cert')).toBeNull();
    expect(el.querySelector('.ch-recomendacion-panel__vacio')?.textContent).toContain(
      'En cuanto tengas una certificación con alerta activa'
    );
    expect(el.querySelector('.ch-recomendacion-panel__ia-badge')?.textContent).toContain(
      'Impulsado por IA'
    );
  });

  it('el enlace de detalle apunta a la certificación prioritaria', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('recomendacion', RECOMENDACION);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const enlace = el.querySelector('a') as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toBe('/empresa/certificaciones/c1');
  });
});
