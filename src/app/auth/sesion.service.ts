import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { Avisos } from '../core/avisos';
import { ClaimsToken, decodificarJwt, scopesDe } from './jwt';
import { RUTA_LOGIN } from './msal.config';
import { Rol, Usuario, rolesValidos, tieneAlgunRol } from './roles';

const EVENTOS_ESCUCHADOS: EventType[] = [
  EventType.LOGIN_SUCCESS,
  EventType.LOGIN_FAILURE,
  EventType.ACQUIRE_TOKEN_FAILURE,
  EventType.LOGOUT_SUCCESS,
];

/**
 * Sesión del usuario. Obtiene el access token del API con `acquireTokenSilent` y lee de sus claims los
 * roles (`roles`) y los scopes (`scp`). Es la misma información que valida el BFF, así que lo que se
 * muestra en pantalla coincide con lo que el backend va a permitir.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly msal = inject(MsalService);
  private readonly broadcast = inject(MsalBroadcastService);
  private readonly avisos = inject(Avisos);

  readonly usuario = signal<Usuario | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null);

  private carga: Promise<Usuario | null> | null = null;
  private cuentaDeLaCarga: string | null = null;

  constructor() {
    this.escucharEventosDeMsal();
  }

  tieneRol(...roles: Rol[]): boolean {
    return tieneAlgunRol(this.usuario(), roles);
  }

  /**
   * Carga (una vez por cuenta) los datos del usuario desde el access token.
   * Devuelve null si no hay sesión: en ese caso MsalGuard se encarga de mandar al login.
   */
  async cargar(): Promise<Usuario | null> {
    await this.msal.instance.initialize();
    const cuenta = this.cuentaActiva();
    if (!cuenta) {
      this.usuario.set(null);
      return null;
    }
    if (!this.carga || this.cuentaDeLaCarga !== cuenta.homeAccountId) {
      this.cuentaDeLaCarga = cuenta.homeAccountId;
      this.carga = this.leerAccessToken(cuenta);
    }
    return this.carga;
  }

  iniciarSesion(): void {
    this.msal.loginRedirect({ scopes: [environment.apiScope] }).subscribe({
      error: (e) => this.avisos.error('No se pudo iniciar sesión: ' + descripcion(e)),
    });
  }

  cerrarSesion(): void {
    const cuenta = this.cuentaActiva();
    this.olvidar();
    this.msal
      .logoutRedirect({ account: cuenta ?? undefined, postLogoutRedirectUri: window.location.origin + RUTA_LOGIN })
      .subscribe({ error: (e) => this.avisos.error('No se pudo cerrar sesión: ' + descripcion(e)) });
  }

  cuentaActiva(): AccountInfo | null {
    const instancia = this.msal.instance;
    let cuenta = instancia.getActiveAccount();
    if (!cuenta) {
      const cuentas = instancia.getAllAccounts();
      if (cuentas.length > 0) {
        cuenta = cuentas[0];
        instancia.setActiveAccount(cuenta);
      }
    }
    return cuenta;
  }

  private async leerAccessToken(cuenta: AccountInfo): Promise<Usuario | null> {
    try {
      const resultado = await this.msal.instance.acquireTokenSilent({ scopes: [environment.apiScope], account: cuenta });
      const usuario = usuarioDesdeClaims(decodificarJwt(resultado.accessToken), resultado.expiresOn);
      this.usuario.set(usuario);
      return usuario;
    } catch (e) {
      this.carga = null;
      if (e instanceof InteractionRequiredAuthError) {
        // La sesión en Azure expiró o falta consentimiento: hay que volver a pasar por Azure AD.
        await this.msal.instance.acquireTokenRedirect({ scopes: [environment.apiScope], account: cuenta });
        return null;
      }
      // Cualquier otro error: avisar y seguir con los claims del id token, sin dejar la app en blanco.
      this.avisos.error('No se pudo obtener el token de acceso al API: ' + descripcion(e));
      const usuario = usuarioDesdeClaims((cuenta.idTokenClaims ?? {}) as ClaimsToken, null);
      this.usuario.set(usuario);
      return usuario;
    }
  }

  private olvidar(): void {
    this.carga = null;
    this.cuentaDeLaCarga = null;
    this.usuario.set(null);
  }

  private escucharEventosDeMsal(): void {
    this.broadcast.msalSubject$
      .pipe(
        filter((evento: EventMessage) => EVENTOS_ESCUCHADOS.includes(evento.eventType)),
      )
      .subscribe((evento) => {
        switch (evento.eventType) {
          case EventType.LOGIN_SUCCESS: {
            const resultado = evento.payload as AuthenticationResult;
            this.msal.instance.setActiveAccount(resultado.account);
            this.olvidar();
            void this.cargar();
            break;
          }
          case EventType.LOGIN_FAILURE:
            this.avisos.error('El inicio de sesión falló: ' + descripcion(evento.error));
            break;
          case EventType.ACQUIRE_TOKEN_FAILURE:
            // InteractionRequiredAuthError la resuelve el MsalInterceptor con un redirect; el resto se avisa.
            if (!(evento.error instanceof InteractionRequiredAuthError)) {
              this.avisos.error('No se pudo renovar el acceso: ' + descripcion(evento.error));
            }
            break;
          case EventType.LOGOUT_SUCCESS:
            this.olvidar();
            break;
        }
      });
  }
}

export function usuarioDesdeClaims(claims: ClaimsToken, expira: Date | null): Usuario {
  return {
    oid: claims.oid ?? '',
    nombre: claims.name ?? claims.preferred_username ?? 'Usuario',
    email: claims.preferred_username ?? '',
    roles: rolesValidos(claims.roles),
    scopes: scopesDe(claims),
    expira: expira ?? (claims.exp ? new Date(claims.exp * 1000) : null),
  };
}

function descripcion(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return error ? String(error) : 'error desconocido';
}
