import { HttpErrorResponse } from '@angular/common/http';
import { ErrorApi } from './modelos';

/**
 * Convierte un error HTTP en un mensaje para el usuario. Todos los servicios (BFF, catalog, reservations)
 * responden `{ message }` en español, así que casi siempre se muestra ese texto tal cual.
 */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado';
  }
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión o intenta más tarde.';
  }
  const cuerpo = error.error as Partial<ErrorApi> | null;
  const detalle = cuerpo && typeof cuerpo === 'object' && cuerpo.message ? cuerpo.message : null;
  switch (error.status) {
    case 401:
      return 'Tu sesión no es válida' + (detalle ? `: ${detalle}` : '') + '. Vuelve a iniciar sesión.';
    case 403:
      return detalle ?? 'No tienes permiso para esta operación.';
    case 503:
      return detalle ?? 'El servicio no está disponible en este momento.';
    default:
      return detalle ?? `Error ${error.status}: ${error.statusText || 'respuesta inesperada del servidor'}`;
  }
}
