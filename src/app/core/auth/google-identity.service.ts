import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const google: any;

const GIS_SRC = 'https://accounts.google.com/gsi/client';

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private cargado?: Promise<void>;

  private cargarScript(): Promise<void> {
    if (this.cargado) {
      return this.cargado;
    }
    this.cargado = new Promise<void>((resolve, reject) => {
      const existente = document.querySelector(`script[src="${GIS_SRC}"]`);
      if (existente) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'));
      document.head.appendChild(script);
    });
    return this.cargado;
  }

  async renderizarBoton(
    contenedor: HTMLElement,
    onCredential: (idToken: string) => void
  ): Promise<void> {
    await this.cargarScript();
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => onCredential(response.credential),
    });
    google.accounts.id.renderButton(contenedor, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'center',
      locale: 'es',
      width: contenedor.clientWidth || 380,
    });
  }
}
