import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegistroEmpresaCorreoRequest,
  RegistroPendienteResponse,
  RegistroUsuarioCorreoRequest,
} from './auth.models';

const TOKEN_KEY = 'carbonhub.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly rol = computed(() => this.leerRolDeToken(this.token()));

  loginConCorreo(email: string, contrasena: string): Observable<AuthResponse> {
    return this.login({ metodo: 'CORREO', email, contrasena });
  }

  loginConGoogle(idToken: string): Observable<AuthResponse> {
    return this.login({ metodo: 'GOOGLE', idToken });
  }

  registrarConGoogle(
    tipo: 'usuario' | 'empresa' | 'auditor',
    idToken: string
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/registro/${tipo}`, { idToken, aceptaTerminos: true })
      .pipe(tap((response) => this.guardarSesion(response)));
  }

  registrarAuditorCorreo(body: {
    nombre: string;
    apellidos: string;
    email: string;
    contrasena: string;
    aceptaTerminos: boolean;
  }): Observable<{ mensaje: string; email: string }> {
    return this.http.post<{ mensaje: string; email: string }>(
      `${this.baseUrl}/registro/auditor/correo`,
      body
    );
  }

  registrarEmpresaConCorreo(
    datos: RegistroEmpresaCorreoRequest
  ): Observable<RegistroPendienteResponse> {
    return this.http.post<RegistroPendienteResponse>(
      `${this.baseUrl}/registro/empresa/correo`,
      datos
    );
  }

  registrarUsuarioConCorreo(
    datos: RegistroUsuarioCorreoRequest
  ): Observable<RegistroPendienteResponse> {
    return this.http.post<RegistroPendienteResponse>(
      `${this.baseUrl}/registro/usuario/correo`,
      datos
    );
  }

  private login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, request)
      .pipe(tap((response) => this.guardarSesion(response)));
  }

  private guardarSesion(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    this.token.set(response.token);
  }

  cerrarSesion(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }

  private leerRolDeToken(token: string | null): string | null {
    if (!token) {
      return null;
    }

    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    try {
      const normalizado = payload.replace(/-/g, '+').replace(/_/g, '/');
      const relleno = normalizado.padEnd(Math.ceil(normalizado.length / 4) * 4, '=');
      const datos = JSON.parse(atob(relleno)) as { rol?: string };
      return datos.rol ?? null;
    } catch {
      return null;
    }
  }
}
