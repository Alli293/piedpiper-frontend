export type TipoDocumentoLegal = 'terminos' | 'privacidad';

export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
  lista?: string[];
}

export interface DocumentoLegal {
  titulo: string;
  entradilla: string;
  secciones: SeccionLegal[];
}

/**
 * Fecha de última revisión de ambos documentos. Se muestra al pie: un texto legal sin fecha no le
 * dice al usuario si lo que está leyendo sigue vigente.
 */
export const ULTIMA_ACTUALIZACION = 'agosto de 2026';

/**
 * Aviso que encabeza los dos documentos. CarbonHub es un proyecto académico y decirlo de frente es
 * más honesto que imitar el tono de un contrato comercial: quien lee tiene que saber a qué atenerse
 * antes de registrar datos de su empresa.
 */
const AVISO_ACADEMICO =
  'CarbonHub es un proyecto académico desarrollado por estudiantes de la Universidad Cenfotec. ' +
  'No es un servicio comercial y este documento no sustituye la asesoría legal de un profesional. ' +
  'No registres información sensible o real de tu organización que no estés dispuesto a compartir ' +
  'en un entorno de práctica.';

export const CONTENIDOS_LEGALES: Record<TipoDocumentoLegal, DocumentoLegal> = {
  terminos: {
    titulo: 'Términos de uso',
    entradilla: AVISO_ACADEMICO,
    secciones: [
      {
        titulo: '1. Qué es CarbonHub',
        parrafos: [
          'CarbonHub es una plataforma para registrar y dar seguimiento a la huella de carbono de ' +
            'una organización, solicitar auditorías ambientales y obtener certificaciones ' +
            'verificables. Al crear una cuenta aceptas estos términos.',
        ],
      },
      {
        titulo: '2. Tu cuenta',
        parrafos: [
          'Eres responsable de la veracidad de los datos que registras y de mantener tu contraseña ' +
            'en resguardo. Si detectas un uso no autorizado de tu cuenta, cambia tu contraseña de ' +
            'inmediato desde la pantalla de recuperación.',
          'Podemos suspender una cuenta que incumpla estos términos o que se use para registrar ' +
            'información falsa con el fin de obtener una certificación.',
        ],
      },
      {
        titulo: '3. Auditorías y certificaciones',
        parrafos: [
          'Las certificaciones que emite la plataforma se apoyan en el resultado que registra un ' +
            'auditor certificado dentro del sistema. Una certificación no constituye un aval ' +
            'oficial de ninguna autoridad ambiental ni tiene validez regulatoria.',
          'Los auditores son responsables de los resultados que registran. La plataforma conserva ' +
            'el historial de cada solicitud para que ese registro sea trazable.',
        ],
      },
      {
        titulo: '4. Contenido generado con inteligencia artificial',
        parrafos: [
          'Algunas secciones muestran textos generados automáticamente, como las recomendaciones ' +
            'de auditores o las interpretaciones de tu índice de madurez ambiental. Esos textos son ' +
            'orientativos, pueden contener errores y no sustituyen el criterio de un profesional. ' +
            'Las decisiones sobre tu organización siguen siendo tuyas.',
        ],
      },
      {
        titulo: '5. Disponibilidad',
        parrafos: [
          'Al ser un proyecto académico, el servicio puede interrumpirse, cambiar o dejar de estar ' +
            'disponible sin aviso previo, y los datos cargados pueden eliminarse al cierre del curso.',
        ],
      },
    ],
  },
  privacidad: {
    titulo: 'Política de privacidad',
    entradilla: AVISO_ACADEMICO,
    secciones: [
      {
        titulo: '1. Qué datos recolectamos',
        parrafos: ['Guardamos únicamente lo necesario para que la plataforma funcione:'],
        lista: [
          'De tu cuenta: nombre, apellidos, correo electrónico, rol y método de autenticación.',
          'De tu empresa: nombre, cédula jurídica, sector, país, cantidad de empleados, correo ' +
            'corporativo y sitio web.',
          'De tu actividad: los registros de emisiones que cargas, las solicitudes de auditoría y ' +
            'sus documentos de respaldo.',
        ],
      },
      {
        titulo: '2. Cómo protegemos tu contraseña',
        parrafos: [
          'Tu contraseña nunca se guarda en texto plano: se almacena su huella criptográfica, así ' +
            'que ni siquiera el equipo de desarrollo puede leerla. Si inicias sesión con Google, no ' +
            'guardamos contraseña alguna.',
        ],
      },
      {
        titulo: '3. Con quién compartimos datos',
        parrafos: [
          'No vendemos ni cedemos tus datos. Para funcionar, la plataforma se apoya en estos ' +
            'servicios de terceros:',
        ],
        lista: [
          'Google, si eliges iniciar sesión con tu cuenta, únicamente para verificar tu identidad.',
          'Climatiq, para calcular factores de emisión a partir de los datos de actividad que ' +
            'registras.',
          'Google Gemini, para redactar los textos orientativos de la plataforma. A ese servicio se ' +
            'le envía solo la información pública necesaria para redactar; nunca el nombre de tu ' +
            'empresa, su identificador ni datos de otras organizaciones.',
          'Un proveedor de correo, para enviarte verificaciones, recuperaciones de contraseña y ' +
            'avisos de vencimiento.',
        ],
      },
      {
        titulo: '4. Datos públicos por decisión tuya',
        parrafos: [
          'El perfil público de tu empresa y las certificaciones que decidas publicar son ' +
            'accesibles sin iniciar sesión, porque su propósito es que un tercero pueda verificarlas. ' +
            'Tú controlas qué se publica desde la configuración de tu perfil.',
        ],
      },
      {
        titulo: '5. Tus derechos',
        parrafos: [
          'Puedes consultar, corregir o solicitar la eliminación de tus datos escribiendo al equipo ' +
            'del proyecto. Como es un entorno académico, los datos se eliminan al finalizar el curso.',
        ],
      },
    ],
  },
};
