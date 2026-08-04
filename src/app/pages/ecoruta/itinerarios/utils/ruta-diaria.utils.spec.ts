import { ItinerarioActividad } from '../models/itinerario.model';
import { derivarEtiquetaRuta } from './ruta-diaria.utils';

function actividad(provincia: string | null): ItinerarioActividad {
  return {
    nombre: 'Actividad',
    descripcion: null,
    horario: '09:00:00',
    duracionMinutos: 60,
    costoAproximado: null,
    moneda: null,
    establecimientoRecomendado: null,
    provincia: provincia as string,
  };
}

describe('derivarEtiquetaRuta', () => {
  it('muestra una sola provincia cuando todas las actividades son de la misma', () => {
    const actividades = [actividad('PUNTARENAS'), actividad('PUNTARENAS')];

    expect(derivarEtiquetaRuta(actividades)).toBe('Puntarenas');
  });

  it('muestra primera y última provincia cuando difieren', () => {
    const actividades = [actividad('SAN_JOSE'), actividad('PUNTARENAS'), actividad('GUANACASTE')];

    expect(derivarEtiquetaRuta(actividades)).toBe('San José → Guanacaste');
  });

  it('ignora actividades sin provincia (null, undefined o vacía)', () => {
    const actividades = [actividad(null), actividad('LIMON'), actividad('')];

    expect(derivarEtiquetaRuta(actividades)).toBe('Limón');
  });

  it('retorna cadena vacía cuando no hay actividades', () => {
    expect(derivarEtiquetaRuta([])).toBe('');
  });

  it('retorna cadena vacía cuando ninguna actividad tiene provincia válida', () => {
    const actividades = [actividad(null), actividad('')];

    expect(derivarEtiquetaRuta(actividades)).toBe('');
  });

  it('usa el código crudo como respaldo si la provincia no está en el catálogo', () => {
    const actividades = [actividad('ATLANTIDA')];

    expect(derivarEtiquetaRuta(actividades)).toBe('ATLANTIDA');
  });
});
