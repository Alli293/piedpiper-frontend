import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EnlaceUnSoloUsoService {
  consumir(tokenLegacy = ''): string {
    const url = new URL(window.location.href);
    const fragmento = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
    const token = fragmento.get('token') ?? url.searchParams.get('token') ?? tokenLegacy;
    let contieneSecreto = false;

    if (url.searchParams.has('token')) {
      url.searchParams.delete('token');
      contieneSecreto = true;
    }
    if (fragmento.has('token')) {
      fragmento.delete('token');
      url.hash = fragmento.size > 0 ? fragmento.toString() : '';
      contieneSecreto = true;
    }

    if (contieneSecreto) {
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`
      );
    }

    return token;
  }
}
