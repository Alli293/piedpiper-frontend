import { HttpInterceptorFn } from '@angular/common/http';
import { esUrlDelBackend } from './backend-url.util';

export const ngrokInterceptor: HttpInterceptorFn = (req, next) => {
  if (!esUrlDelBackend(req.url)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { 'ngrok-skip-browser-warning': 'true' } }));
};
