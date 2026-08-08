import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InsigniaNotificacionHostComponent } from './insignia-notificacion-host.component';
import { InsigniaNotificacionService } from '../../../core/services/insignia-notificacion.service';
import { InsigniaEcoRuta } from '../../../core/models/insignia-ecoruta.model';

function insignia(idInsignia: number, nombre = `Insignia ${idInsignia}`): InsigniaEcoRuta {
  return {
    idInsignia,
    nombre,
    descripcion: `Descripción de ${nombre}`,
    eventoDesbloqueo: `evento_${idInsignia}`,
    fechaObtencion: '2026-08-08T12:00:00Z',
  };
}

describe('InsigniaNotificacionHostComponent', () => {
  let pendientes: ReturnType<typeof signal<InsigniaEcoRuta[]>>;
  let descartarActual: ReturnType<typeof vi.fn>;

  function createFixture() {
    pendientes = signal<InsigniaEcoRuta[]>([]);
    descartarActual = vi.fn();

    const fixture = TestBed.configureTestingModule({
      imports: [InsigniaNotificacionHostComponent],
      providers: [
        {
          provide: InsigniaNotificacionService,
          useValue: { pendientes, descartarActual },
        },
      ],
    }).createComponent(InsigniaNotificacionHostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('no renderiza nada cuando no hay insignias pendientes', () => {
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('.ch-insignia-notificacion')).toBeNull();
  });

  it('renderiza el nombre y la descripción de la insignia actual (la cabeza de la cola)', () => {
    const fixture = createFixture();
    pendientes.set([insignia(1, 'Primer itinerario'), insignia(2, 'Exploradora local')]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.ch-insignia-notificacion__nombre')?.textContent).toBe(
      'Primer itinerario'
    );
    expect(root.querySelector('.ch-insignia-notificacion__descripcion')?.textContent).toBe(
      'Descripción de Primer itinerario'
    );
  });

  it('llama a descartarActual() al hacer click en el botón de cerrar', () => {
    const fixture = createFixture();
    pendientes.set([insignia(1)]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('.ch-insignia-notificacion__cerrar')!.click();

    expect(descartarActual).toHaveBeenCalledTimes(1);
  });
});
