import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCR from '@angular/common/locales/es-CR';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';
import { sesionInterceptor } from './core/auth/sesion.interceptor';

// Sin esto, DatePipe (y cualquier formato de fecha en texto: "EEEE d MMM", nombres de mes/día)
// cae al locale por defecto de Angular (en-US) — el resto de la app ya asume es-CR (ver
// shared/utils/currency.utils.ts, que sí lo pasa explícito a Intl.NumberFormat en cada llamada;
// DatePipe en cambio depende de este LOCALE_ID global, que nunca se había registrado).
registerLocaleData(localeEsCR, 'es-CR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es-CR' },
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor, sesionInterceptor])),
  ],
};
