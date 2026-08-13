import { AlternativaDTO } from '../models/alternativas.model';
import { crearSustitucionRequest } from './sustitucion.utils';

describe('crearSustitucionRequest', () => {
  const alternativa: AlternativaDTO = {
    nombre: 'Senderismo en Reserva Biológica',
    descripcion: 'Caminata guiada por bosque primario',
    ecoScore: 85,
    costoAproximado: 15000,
    moneda: 'CRC',
    establecimientoRecomendado: 'Reserva Monteverde',
    diferenciaAmbiental: 20,
    mejorDesempeno: true,
  };

  it('mapea los campos de la alternativa junto con categoriaTuristica y provincia', () => {
    const resultado = crearSustitucionRequest(alternativa, 'AVENTURA', 'PUNTARENAS');

    expect(resultado).toEqual({
      nombre: 'Senderismo en Reserva Biológica',
      descripcion: 'Caminata guiada por bosque primario',
      costoAproximado: 15000,
      moneda: 'CRC',
      establecimientoRecomendado: 'Reserva Monteverde',
      ecoScore: 85,
      categoriaTuristica: 'AVENTURA',
      provincia: 'PUNTARENAS',
    });
  });

  it('no incluye diferenciaAmbiental ni mejorDesempeno del origen', () => {
    const resultado = crearSustitucionRequest(alternativa, 'AVENTURA', 'PUNTARENAS');

    expect(resultado).not.toHaveProperty('diferenciaAmbiental');
    expect(resultado).not.toHaveProperty('mejorDesempeno');
  });

  it('propaga descripcion, costoAproximado, moneda y establecimientoRecomendado null tal cual', () => {
    const alternativaSinDetalle: AlternativaDTO = {
      ...alternativa,
      descripcion: null,
      costoAproximado: null,
      moneda: null,
      establecimientoRecomendado: null,
    };

    const resultado = crearSustitucionRequest(alternativaSinDetalle, 'AVENTURA', 'PUNTARENAS');

    expect(resultado.descripcion).toBeNull();
    expect(resultado.costoAproximado).toBeNull();
    expect(resultado.moneda).toBeNull();
    expect(resultado.establecimientoRecomendado).toBeNull();
  });
});
