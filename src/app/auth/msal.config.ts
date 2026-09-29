import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import { environment } from '../../environments/environment';

/** true mientras los placeholders de Azure no se hayan reemplazado por valores reales. */
export const configuracionPendiente =
  environment.azure.clientId.includes('<') || environment.azure.tenantId.includes('<');

/** Ruta a la que Azure AD devuelve la respuesta del login. No tiene guard ni redirección. */
export const RUTA_LOGIN = '/login';

/**
 * Instancia de MSAL (flujo authorization code + PKCE para SPA).
 * - authority con el tenant: solo usuarios de nuestro directorio.
 * - redirectUri /login: la respuesta (#code=...) llega a una ruta sin guard, así el router no la borra.
 * - sessionStorage: los tokens viven solo mientras la pestaña está abierta.
 */
export function crearInstanciaMsal(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.azure.clientId,
      authority: `https://login.microsoftonline.com/${environment.azure.tenantId}`,
      redirectUri: window.location.origin + RUTA_LOGIN,
      postLogoutRedirectUri: window.location.origin + RUTA_LOGIN,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
    system: {
      loggerOptions: {
        logLevel: environment.production ? LogLevel.Error : LogLevel.Warning,
        piiLoggingEnabled: false,
        loggerCallback: (nivel, mensaje) => {
          if (nivel === LogLevel.Error) {
            console.error(mensaje);
          } else if (nivel === LogLevel.Warning) {
            console.warn(mensaje);
          }
        },
      },
    },
  });
}

/**
 * MsalGuard: si no hay sesión, redirige a Azure AD pidiendo ya el scope del API, para que el
 * consentimiento se dé en el primer login.
 */
export function crearConfigGuard(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: [environment.apiScope] },
    loginFailedRoute: RUTA_LOGIN,
  };
}

/**
 * MsalInterceptor: a toda petición cuya URL calce con el API Gateway le adjunta
 * `Authorization: Bearer <access_token>` con el scope del API. Obtiene el token con acquireTokenSilent
 * (renueva solo, con refresh token) y, si Azure exige interacción (InteractionRequiredAuthError),
 * hace acquireTokenRedirect. Las peticiones a otros dominios salen sin token.
 */
export function crearConfigInterceptor(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map<string, string[]>([
      [`${environment.apiBaseUrl}/api/*`, [environment.apiScope]],
    ]),
  };
}
