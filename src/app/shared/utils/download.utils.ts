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
 * Abre un blob en una pestaña nueva para previsualizarlo.
 *
 * Un `<a href>` apuntando al endpoint no sirve cuando la API exige la cabecera `Authorization`:
 * la navegación del navegador no la envía y la petición vuelve 401. Hay que traer el contenido
 * con el cliente HTTP (que sí pasa por el interceptor) y abrir el blob resultante.
 *
 * Devuelve `false` si el navegador bloqueó la ventana emergente, para que quien llama lo informe.
 */
export function abrirBlobEnPestana(blob: Blob): boolean {
  const url = URL.createObjectURL(blob);
  const ventana = window.open(url, '_blank', 'noopener');

  // No se revoca de inmediato: la pestaña recién abierta todavía no leyó el contenido y
  // revocar aquí la dejaría en blanco.
  setTimeout(() => URL.revokeObjectURL(url), MILISEGUNDOS_ANTES_DE_LIBERAR);

  return ventana !== null;
}

const MILISEGUNDOS_ANTES_DE_LIBERAR = 60_000;
