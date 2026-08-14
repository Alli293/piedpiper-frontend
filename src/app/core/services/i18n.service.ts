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
  'perfil.titulo': 'Configura tu perfil',
  'perfil.subtitulo': 'Completa estos datos para dejar tu cuenta lista.',
  'perfil.nombre': 'Nombre visible',
  'perfil.nombreError': 'El nombre debe tener al menos 2 caracteres.',
  'perfil.nombreErrorMax': 'El nombre no puede superar los 100 caracteres.',
  'perfil.empresa.titulo': 'Datos de tu empresa',
  'perfil.empresa.nombre': 'Empresa',
  'perfil.empresa.soloLectura': 'Estos datos los administra el administrador de tu empresa.',
  'perfil.sector': 'Sector industrial',
  'perfil.pais': 'País',
  'perfil.empleados': 'Cantidad de empleados',
  'perfil.auditor.nota': 'Tus credenciales profesionales están en validación y no pueden editarse.',
  'perfil.guardar': 'Guardar y continuar',
  'perfil.errorGuardar': 'No se pudo guardar tu perfil. Intenta nuevamente.',
  'perfil.cargando': 'Cargando tu perfil…',
  'perfil.errorCargar': 'No se pudo cargar tu perfil. Verifica tu conexión e intenta de nuevo.',
  'perfil.reintentar': 'Reintentar',
  'perfil.sectorError': 'Selecciona un sector industrial.',
  'perfil.paisError': 'Ingresa un país de hasta 100 caracteres.',
  'perfil.empleadosError': 'Ingresa un número de empleados mayor que 0.',
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
  'perfil.titulo': 'Set up your profile',
  'perfil.subtitulo': 'Complete these details to get your account ready.',
  'perfil.nombre': 'Display name',
  'perfil.nombreError': 'The name must be at least 2 characters long.',
  'perfil.nombreErrorMax': 'The name cannot exceed 100 characters.',
  'perfil.empresa.titulo': 'Your company details',
  'perfil.empresa.nombre': 'Company',
  'perfil.empresa.soloLectura': 'These details are managed by your company administrator.',
  'perfil.sector': 'Industry sector',
  'perfil.pais': 'Country',
  'perfil.empleados': 'Number of employees',
  'perfil.auditor.nota': 'Your professional credentials are under review and cannot be edited.',
  'perfil.guardar': 'Save and continue',
  'perfil.errorGuardar': 'Your profile could not be saved. Please try again.',
  'perfil.cargando': 'Loading your profile…',
  'perfil.errorCargar': 'Your profile could not be loaded. Check your connection and try again.',
  'perfil.reintentar': 'Retry',
  'perfil.sectorError': 'Select an industry sector.',
  'perfil.paisError': 'Enter a country of up to 100 characters.',
  'perfil.empleadosError': 'Enter a number of employees greater than 0.',
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
