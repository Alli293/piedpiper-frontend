export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = 'none';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/**
 * Abre una pestaña vacía, para llenarla después con {@link mostrarBlobEnPestana}.
 *
 * Va separado del contenido a propósito: el navegador solo deja abrir una pestaña dentro de la
 * ventana de activación del usuario, o sea durante el manejo del clic. Si se abre al volver una
 * petición, ya está fuera de esa ventana y la bloquea como emergente.
 *
 * Devuelve `null` si aun así la bloqueó, para que quien llama lo informe.
 *
 * No lleva `noopener`: con esa opción el navegador devuelve `null` y se pierde la referencia que
 * hace falta para cargarle el contenido. El origen es el mismo y la URL es un blob local, así que
 * no hay una página ajena a la que darle acceso a `window.opener`.
 */
export function abrirPestanaEnBlanco(): Window | null {
  return window.open('', '_blank');
}

/**
 * Carga un blob en una pestaña ya abierta.
 *
 * Un `<a href>` apuntando al endpoint no sirve cuando la API exige la cabecera `Authorization`:
 * la navegación del navegador no la envía y la petición vuelve 401. Hay que traer el contenido
 * con el cliente HTTP (que sí pasa por el interceptor) y mostrar el blob resultante.
 */
export function mostrarBlobEnPestana(pestana: Window, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  pestana.location.href = url;

  // No se revoca de inmediato: la pestaña todavía no leyó el contenido y revocar aquí la
  // dejaría en blanco.
  setTimeout(() => URL.revokeObjectURL(url), MILISEGUNDOS_ANTES_DE_LIBERAR);
}

const MILISEGUNDOS_ANTES_DE_LIBERAR = 60_000;
