import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AlternativasComparacionComponent } from './alternativas-comparacion.component';
import { AlternativaDTO } from '../models/alternativas.model';

const ALTERNATIVAS_MOCK: AlternativaDTO[] = [
  {
    nombre: 'Caminata por el bosque nuboso',
    descripcion: 'Recorrido guiado por senderos naturales',
    ecoScore: 85,
    costoAproximado: 15000,
    moneda: 'CRC',
    establecimientoRecomendado: 'Reserva Monteverde',
    diferenciaAmbiental: 25,
    mejorDesempeno: true,
  },
  {
    nombre: 'Observación de aves',
    descripcion: 'Tour de avistamiento en humedales',
    ecoScore: 72,
    costoAproximado: 8000,
    moneda: 'CRC',
    establecimientoRecomendado: null,
    diferenciaAmbiental: 12,
    mejorDesempeno: false,
  },
  {
    nombre: 'Visita a finca orgánica',
    descripcion: null,
    ecoScore: 55,
    costoAproximado: null,
    moneda: null,
    establecimientoRecomendado: 'Finca La Paz',
    diferenciaAmbiental: -5,
    mejorDesempeno: false,
  },
];

const ACTIVIDAD_ORIGINAL = { nombre: 'Canopy extremo', ecoScore: 60 };

describe('AlternativasComparacionComponent', () => {
  function crearFixture(
    alternativas: AlternativaDTO[] = ALTERNATIVAS_MOCK,
    opciones: { cargando?: boolean } = {}
  ): ComponentFixture<AlternativasComparacionComponent> {
    const fixture = TestBed.configureTestingModule({
      imports: [AlternativasComparacionComponent],
    }).createComponent(AlternativasComparacionComponent);

    fixture.componentRef.setInput('alternativas', alternativas);
    fixture.componentRef.setInput('actividadOriginal', ACTIVIDAD_ORIGINAL);
    if (opciones.cargando !== undefined) {
      fixture.componentRef.setInput('cargando', opciones.cargando);
    }
    fixture.detectChanges();
    return fixture;
  }

  describe('renderizado correcto con alternativas', () => {
    it('muestra una tarjeta por cada alternativa', () => {
      const fixture = crearFixture();
      const tarjetas = fixture.nativeElement.querySelectorAll('.ch-alternativas__tarjeta');

      expect(tarjetas.length).toBe(3);
    });

    it('muestra el nombre de cada alternativa', () => {
      const fixture = crearFixture();
      const nombres = fixture.nativeElement.querySelectorAll('.ch-alternativas__tarjeta-nombre');

      expect(nombres[0].textContent).toContain('Caminata por el bosque nuboso');
      expect(nombres[1].textContent).toContain('Observación de aves');
      expect(nombres[2].textContent).toContain('Visita a finca orgánica');
    });

    it('muestra el ecoScore de cada alternativa', () => {
      const fixture = crearFixture();
      const scores = fixture.nativeElement.querySelectorAll('.ch-alternativas__score-valor');

      expect(scores[0].textContent?.trim()).toBe('85');
      expect(scores[1].textContent?.trim()).toBe('72');
      expect(scores[2].textContent?.trim()).toBe('55');
    });

    it('muestra el ecoScore original en el título de la comparativa', () => {
      const fixture = crearFixture();
      const titulo = fixture.nativeElement.querySelector('.ch-alternativas__titulo');

      expect(titulo.textContent).toContain('60');
    });

    it('muestra la diferencia ambiental con signo positivo cuando es mayor a 0', () => {
      const fixture = crearFixture();
      const diferencias = fixture.nativeElement.querySelectorAll('.ch-alternativas__diferencia');

      expect(diferencias[0].textContent).toContain('+25');
      expect(diferencias[1].textContent).toContain('+12');
    });

    it('muestra la diferencia ambiental negativa sin signo extra', () => {
      const fixture = crearFixture();
      const diferencias = fixture.nativeElement.querySelectorAll('.ch-alternativas__diferencia');

      expect(diferencias[2].textContent).toContain('-5');
    });

    it('aplica clase positiva cuando diferenciaAmbiental > 0', () => {
      const fixture = crearFixture();
      const diferencias = fixture.nativeElement.querySelectorAll('.ch-alternativas__diferencia');

      expect(diferencias[0].classList.contains('ch-alternativas__diferencia--positiva')).toBe(true);
      expect(diferencias[0].classList.contains('ch-alternativas__diferencia--negativa')).toBe(
        false
      );
    });

    it('aplica clase negativa cuando diferenciaAmbiental < 0', () => {
      const fixture = crearFixture();
      const diferencias = fixture.nativeElement.querySelectorAll('.ch-alternativas__diferencia');

      expect(diferencias[2].classList.contains('ch-alternativas__diferencia--negativa')).toBe(true);
      expect(diferencias[2].classList.contains('ch-alternativas__diferencia--positiva')).toBe(
        false
      );
    });
  });

  describe('highlight de mejor alternativa', () => {
    it('aplica clase --mejor a la tarjeta con mejorDesempeno true', () => {
      const fixture = crearFixture();
      const tarjetas = fixture.nativeElement.querySelectorAll('.ch-alternativas__tarjeta');

      expect(tarjetas[0].classList.contains('ch-alternativas__tarjeta--mejor')).toBe(true);
      expect(tarjetas[1].classList.contains('ch-alternativas__tarjeta--mejor')).toBe(false);
      expect(tarjetas[2].classList.contains('ch-alternativas__tarjeta--mejor')).toBe(false);
    });

    it('muestra badge RECOMENDADA solo en la mejor alternativa', () => {
      const fixture = crearFixture();
      const badges = fixture.nativeElement.querySelectorAll('.ch-alternativas__badge');

      expect(badges.length).toBe(1);
      expect(badges[0].textContent?.trim()).toBe('RECOMENDADA');
    });

    it('muestra botón general "Cambialo por el..." con nombre de la mejor alternativa', () => {
      const fixture = crearFixture();
      const botonGeneral = fixture.nativeElement.querySelector(
        '.ch-alternativas__boton-reemplazar'
      );

      expect(botonGeneral).not.toBeNull();
      expect(botonGeneral.textContent).toContain('Caminata por el bosque nuboso');
    });
  });

  describe('emisión de evento al hacer click en Reemplazar', () => {
    it('emite la alternativa correspondiente al hacer click en el botón de tarjeta', () => {
      const fixture = crearFixture();
      let emitida: AlternativaDTO | undefined;
      fixture.componentInstance.reemplazar.subscribe((alt: AlternativaDTO) => (emitida = alt));

      const botones = fixture.nativeElement.querySelectorAll('.ch-alternativas__boton-tarjeta');
      botones[1].click();

      expect(emitida).toEqual(ALTERNATIVAS_MOCK[1]);
    });

    it('emite la mejor alternativa al hacer click en el botón general', () => {
      const fixture = crearFixture();
      let emitida: AlternativaDTO | undefined;
      fixture.componentInstance.reemplazar.subscribe((alt: AlternativaDTO) => (emitida = alt));

      const botonGeneral = fixture.nativeElement.querySelector(
        '.ch-alternativas__boton-reemplazar'
      );
      botonGeneral.click();

      expect(emitida).toEqual(ALTERNATIVAS_MOCK[0]);
    });
  });

  describe('indicador de carga', () => {
    it('muestra el spinner y mensaje de carga cuando cargando es true', () => {
      const fixture = crearFixture(ALTERNATIVAS_MOCK, { cargando: true });
      const cargando = fixture.nativeElement.querySelector('.ch-alternativas__cargando');
      const spinner = fixture.nativeElement.querySelector('.ch-alternativas__spinner');

      expect(cargando).not.toBeNull();
      expect(spinner).not.toBeNull();
      expect(cargando.textContent).toContain('Actualizando itinerario y recalculando EcoScore');
    });

    it('no muestra las tarjetas cuando está cargando', () => {
      const fixture = crearFixture(ALTERNATIVAS_MOCK, { cargando: true });
      const tarjetas = fixture.nativeElement.querySelectorAll('.ch-alternativas__tarjeta');

      expect(tarjetas.length).toBe(0);
    });

    it('muestra las tarjetas y no muestra spinner cuando cargando es false', () => {
      const fixture = crearFixture(ALTERNATIVAS_MOCK, { cargando: false });
      const spinner = fixture.nativeElement.querySelector('.ch-alternativas__spinner');
      const tarjetas = fixture.nativeElement.querySelectorAll('.ch-alternativas__tarjeta');

      expect(spinner).toBeNull();
      expect(tarjetas.length).toBe(3);
    });
  });
});
