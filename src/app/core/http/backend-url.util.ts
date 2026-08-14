import { environment } from '../../../environments/environment';

export function esUrlDelBackend(url: string): boolean {
  const origenActual = window.location.origin;
  const api = new URL(environment.apiBaseUrl, origenActual);
  const destino = new URL(url, origenActual);
  const rutaApi = api.pathname.replace(/\/$/, '');

  return (
    destino.origin === api.origin &&
    (destino.pathname === rutaApi || destino.pathname.startsWith(`${rutaApi}/`))
  );
}
