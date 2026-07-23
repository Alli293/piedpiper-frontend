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

  getUserId(): string | null {
    return this.getClaims()?.sub ?? null;
  }

  isAdministradorEmpresa(): boolean {
    return this.getRole() === ADMINISTRADOR_EMPRESA;
  }

  getUserInitials(): string {
    return initialsFrom(this.getUserDisplayName());
  }

  getUserDisplayName(): string {
    const claims = this.getClaims();
    return firstNonEmpty(
      claims?.nombreCompleto,
      claims?.name,
      [claims?.nombre, claims?.apellidos].filter(Boolean).join(' '),
      claims?.email,
      claims?.sub
    );
  }

  private getClaims(): JwtClaims | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      return JSON.parse(atob(toBase64(payload))) as JwtClaims;
    } catch (_err: unknown) {
      return null;
    }
  }
}

interface JwtClaims {
  apellidos?: string;
  email?: string;
  name?: string;
  nombre?: string;
  nombreCompleto?: string;
  rol?: string;
  sub?: string;
}

function normalizarRol(rol: string): string {
  return rol.toLowerCase();
}

function toBase64(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  return values.find((value) => value?.trim())?.trim() ?? '';
}

function initialsFrom(value: string): string {
  if (!value) return 'US';

  const base = value.includes('@') ? value.split('@')[0] : value;
  const parts = base
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const initials =
    parts.length > 1
      ? `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`
      : `${parts[0]?.[0] ?? ''}${parts[0]?.[1] ?? ''}`;

  return initials.toUpperCase() || 'US';
}
