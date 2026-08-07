import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RefinamientoChatComponent } from './refinamiento-chat.component';
import { Itinerario } from '../models/itinerario.model';

describe('RefinamientoChatComponent', () => {
  let fixture: ComponentFixture<RefinamientoChatComponent>;

  const itinerario: Itinerario = {
    id: '1',
    cantidadDias: 3,
    fechaInicio: '2026-09-01',
    tipoViaje: 'INDIVIDUAL',
    estado: 'GENERADO',
    version: 1,
    puntuacionAmbientalPreliminar: 82,
    fechaGeneracion: '2026-07-30T20:00:00Z',
    generadoParcial: false,
    mensajeParcial: null,
    dias: [],
  };

  async function crearFixture(input: Itinerario) {
    await TestBed.configureTestingModule({
      imports: [RefinamientoChatComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(RefinamientoChatComponent);
    fixture.componentRef.setInput('itinerario', input);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el mensaje inicial con la cantidad de dias y el EcoScore', async () => {
    fixture = await crearFixture(itinerario);

    expect(fixture.nativeElement.textContent).toContain('3 días');
    expect(fixture.nativeElement.textContent).toContain('EcoScore de 82');
  });

  it('usa singular cuando el itinerario es de un solo dia', async () => {
    fixture = await crearFixture({ ...itinerario, cantidadDias: 1 });

    expect(fixture.nativeElement.textContent).toContain('1 día');
    expect(fixture.nativeElement.textContent).not.toContain('1 días');
  });

  it('omite el EcoScore del mensaje cuando es nulo', async () => {
    fixture = await crearFixture({ ...itinerario, puntuacionAmbientalPreliminar: null });

    // El encabezado del panel ("...recalculá tu EcoScore") sí menciona "EcoScore" siempre;
    // lo que se valida acá es que el MENSAJE del asistente en particular lo omita.
    const mensaje = (fixture.nativeElement as HTMLElement).querySelector(
      '.ch-refinamiento-chat__mensaje p'
    );
    expect(mensaje?.textContent).not.toContain('EcoScore');
    expect(mensaje?.textContent).toContain('está listo. ¿Querés ajustar algo?');
  });

  it('el input y el boton de enviar estan deshabilitados', async () => {
    fixture = await crearFixture(itinerario);
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('input')?.disabled).toBe(true);
    expect(root.querySelector('button')?.disabled).toBe(true);
    expect(root.textContent).toContain('Disponible próximamente');
  });
});
