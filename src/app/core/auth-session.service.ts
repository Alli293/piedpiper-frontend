import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth/auth.service';

export const ADMINISTRADOR_EMPRESA = 'administrador_empresa';
export const USUARIO_GENERAL_EMPRESA = 'usuario_general_empresa';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authService = inject(AuthService);

  getRole(): string {
    const rol = this.getClaims()?.rol;
    return typeof rol === 'string' ? normalizarRol(rol) : USUARIO_GENERAL_EMPRESA;
  }

  getToken(): string | null {
    return this.authService.token();
  }

  isAdministradorEmpresa(): boolean {
    return this.getRole() === ADMINISTRADOR_EMPRESA;
  }

  private getClaims(): JwtClaims | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      return JSON.parse(atob(toBase64(payload))) as JwtClaims;
    } catch {
      return null;
    }
  }
}

interface JwtClaims {
  rol?: string;
}

function normalizarRol(rol: string): string {
  return rol.toLowerCase();
}

function toBase64(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
}
