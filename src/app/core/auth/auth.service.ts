import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PerfilInicialService } from '../services/perfil-inicial.service';
import {
  AuthResponse,
  LoginRequest,
  MensajeResponse,
  RegistroEmpresaCorreoRequest,
  RegistroInvitacionCorreoRequest,
  RegistroPendienteResponse,
  RegistroUsuarioCorreoRequest,
  ValidarTokenResetResponse,
} from './auth.models';

const TOKEN_KEY = 'carbonhub.token';

interface TokenClaims {
  rol?: string;
  estado?: string;
  configuracionCompleta?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly perfilInicialService = inject(PerfilInicialService);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  readonly token = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));

  private readonly claims = computed(() => this.leerClaimsDeToken(this.token()));

  readonly rol = computed(() => this.claims()?.rol ?? null);
  readonly estado = computed(() => this.claims()?.estado ?? null);
  readonly configuracionCompleta = computed(() => this.claims()?.configuracionCompleta ?? false);

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

  registrarConInvitacion(
    tokenInvitacion: string,
    idToken: string,
    aceptaTerminos: boolean
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/registro/invitacion`, {
        tokenInvitacion,
        idToken,
        aceptaTerminos,
      })
      .pipe(tap((response) => this.guardarSesion(response)));
  }

  registrarInvitacionConCorreo(
    tokenInvitacion: string,
    datos: RegistroInvitacionCorreoRequest
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/registro/invitacion/correo`, {
        tokenInvitacion,
        ...datos,
      })
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
    return this.http.post<ValidarTokenResetResponse>(`${this.baseUrl}/reset-contrasena/validar`, {
      token,
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

  verificarCorreo(token: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.baseUrl}/verificar-correo`, { token });
  }

  reenviarVerificacion(email: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.baseUrl}/reenviar-verificacion`, { email });
  }

  private login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, request)
      .pipe(tap((response) => this.guardarSesion(response)));
  }

  private guardarSesion(response: AuthResponse): void {
    sessionStorage.setItem(TOKEN_KEY, response.token);
    this.token.set(response.token);
    this.perfilInicialService.limpiarCache();
  }

  renovarToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  cerrarSesion(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.perfilInicialService.limpiarCache();
  }

  private leerClaimsDeToken(token: string | null): TokenClaims | null {
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
      return JSON.parse(atob(relleno)) as TokenClaims;
    } catch {
      return null;
    }
  }
}
