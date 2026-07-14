import { Injectable, signal } from '@angular/core';
import { Idioma } from '../models/preferencias.model';

const TRADUCCIONES_ES = {
  'config.seccion': 'Configuración',
  'config.titulo': 'Configuración',
  'config.preferencias.titulo': 'Preferencias de la interfaz',
  'config.preferencias.descripcion':
    'Elegí el idioma, la moneda y las unidades con las que querés usar la plataforma. Se guardan en tu perfil y persisten entre sesiones.',
  'config.idioma': 'Idioma',
  'config.moneda': 'Moneda',
  'config.unidades': 'Unidades',
  'config.notaEmisiones':
    'Las emisiones se muestran siempre en kg CO₂e y t CO₂e, independientemente de esta preferencia.',
  'config.guardar': 'Guardar cambios',
  'config.guardarExito': 'Tus preferencias se guardaron correctamente.',
  'config.errorGuardar': 'No se pudieron guardar tus preferencias. Intenta nuevamente.',
  'config.cargando': 'Cargando preferencias…',
} as const;

export type ClaveTraduccion = keyof typeof TRADUCCIONES_ES;

const TRADUCCIONES_EN: Record<ClaveTraduccion, string> = {
  'config.seccion': 'Settings',
  'config.titulo': 'Settings',
  'config.preferencias.titulo': 'Interface preferences',
  'config.preferencias.descripcion':
    'Choose the language, currency and units you want to use across the platform. They are saved to your profile and persist between sessions.',
  'config.idioma': 'Language',
  'config.moneda': 'Currency',
  'config.unidades': 'Units',
  'config.notaEmisiones':
    'Emissions are always displayed in kg CO₂e and t CO₂e, regardless of this preference.',
  'config.guardar': 'Save changes',
  'config.guardarExito': 'Your preferences were saved successfully.',
  'config.errorGuardar': 'Your preferences could not be saved. Please try again.',
  'config.cargando': 'Loading preferences…',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly idiomaActual = signal<Idioma>('ESPANOL');

  readonly idioma = this.idiomaActual.asReadonly();

  usarIdioma(idioma: Idioma): void {
    this.idiomaActual.set(idioma);
  }

  t(clave: ClaveTraduccion): string {
    const diccionario = this.idiomaActual() === 'INGLES' ? TRADUCCIONES_EN : TRADUCCIONES_ES;
    return diccionario[clave] ?? clave;
  }
}
