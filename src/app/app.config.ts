import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import localeEsCl from '@angular/common/locales/es-CL';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalInterceptor,
  MsalService,
} from '@azure/msal-angular';
import { routes } from './app.routes';
import { crearConfigGuard, crearConfigInterceptor, crearInstanciaMsal } from './auth/msal.config';

registerLocaleData(localeEsCl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    { provide: LOCALE_ID, useValue: 'es-CL' },

    // MsalInterceptor es un interceptor de clase: hay que habilitar los interceptores registrados por DI.
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },

    { provide: MSAL_INSTANCE, useFactory: crearInstanciaMsal },
    { provide: MSAL_GUARD_CONFIG, useFactory: crearConfigGuard },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: crearConfigInterceptor },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
};
