import { Injectable } from '@angular/core';

export const ADMINISTRADOR_EMPRESA = 'administrador_empresa';
export const USUARIO_GENERAL_EMPRESA = 'usuario_general_empresa';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  getRole(): string {
    return localStorage.getItem('carbonhub_role') ?? USUARIO_GENERAL_EMPRESA;
  }

  getToken(): string | null {
    return localStorage.getItem('carbonhub_token');
  }

  getEmpresaId(): number {
    const storedId = Number(localStorage.getItem('carbonhub_empresa_id'));
    return Number.isInteger(storedId) && storedId > 0 ? storedId : 0;
  }

  isAdministradorEmpresa(): boolean {
    return this.getRole() === ADMINISTRADOR_EMPRESA;
  }
}
