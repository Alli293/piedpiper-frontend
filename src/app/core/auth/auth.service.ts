import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  MensajeResponse,
  RegistroEmpresaCorreoRequest,
  RegistroPendienteResponse,
  RegistroUsuarioCorreoRequest,
  ValidarTokenResetResponse,
} from './auth.models';

const TOKEN_KEY = 'carbonhub.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

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

  solicitarResetContrasena(email: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.baseUrl}/solicitar-reset-contrasena`, {
      email,
    });
  }

  validarTokenReset(token: string): Observable<ValidarTokenResetResponse> {
    return this.http.get<ValidarTokenResetResponse>(`${this.baseUrl}/reset-contrasena`, {
      params: { token },
    });
  }

  restablecerContrasena(
    token: string,
    nuevaContrasena: string,
    confirmarContrasena: string
  ): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.baseUrl}/restablecer-contrasena`, {
      token,
      nuevaContrasena,
      confirmarContrasena,
    });
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
}
