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

/** Qué pasó al intentar previsualizar, para que quien llama decida qué mensaje mostrar. */
export type ResultadoPrevisualizacion = 'abierta' | 'bloqueada' | 'fallo';

/**
 * Abre un blob en una pestaña nueva para previsualizarlo.
 *
 * Un `<a href>` apuntando al endpoint no sirve cuando la API exige la cabecera `Authorization`:
 * la navegación del navegador no la envía y la petición vuelve 401. Hay que traer el contenido
 * con el cliente HTTP (que sí pasa por el interceptor) y mostrar el blob resultante.
 *
 * Recibe cómo traer el blob en vez de recibirlo ya resuelto, y nunca devuelve la referencia a la
 * pestaña, por dos razones:
 *
 * 1. El navegador solo deja abrir una pestaña dentro de la ventana de activación del usuario, o
 *    sea durante el manejo del clic. Con el blob ya resuelto, la apertura cae después de la
 *    petición, fuera de esa ventana, y la bloquea como emergente. Acá se abre primero y se le
 *    carga el contenido cuando llega.
 * 2. Sin la referencia afuera, nadie puede apuntar esta pestaña a un origen ajeno. Importa porque
 *    no se usa `noopener`: con esa opción `window.open` devuelve `null` y se pierde la referencia
 *    que hace falta para cargarle el contenido. Al quedar encerrada acá, lo único que puede
 *    recibir es una URL de blob local.
 */
export async function previsualizarBlobEnPestana(
  traerBlob: () => Promise<Blob>
): Promise<ResultadoPrevisualizacion> {
  const pestana = window.open('', '_blank');
  if (!pestana) {
    return 'bloqueada';
  }

  let blob: Blob;
  try {
    blob = await traerBlob();
  } catch (err: unknown) {
    pestana.close();
    throw err;
  }

  const url = URL.createObjectURL(blob);
  pestana.location.href = url;
  liberarCuandoYaNoHagaFalta(pestana, url);
  return 'abierta';
}

/**
 * Libera la URL sin arriesgarse a hacerlo antes de tiempo.
 *
 * Un temporizador fijo no sirve: en una pestaña en segundo plano, en un dispositivo lento o con
 * el throttling del navegador, el visor puede no haber terminado de leer cuando vence, y la
 * pestaña queda en blanco. Se libera cuando la pestaña avisa que cargó, y si eso nunca llega
 * (algunos visores de PDF no emiten `load`), al salir de la aplicación, que es el punto en que la
 * memoria se recupera igual.
 */
function liberarCuandoYaNoHagaFalta(pestana: Window, url: string): void {
  let liberada = false;
  const liberar = (): void => {
    if (liberada) return;
    liberada = true;
    URL.revokeObjectURL(url);
  };

  pestana.addEventListener('load', liberar, { once: true });
  window.addEventListener('pagehide', liberar, { once: true });
}
