import { HttpErrorResponse } from '@angular/common/http';
import { mensajeDeError } from './errores';

function errorHttp(status: number, message?: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    statusText: 'x',
    error: message ? { status, message, error: 'x', path: '/api', timestamp: '' } : null,
  });
}

describe('mensajeDeError', () => {
  it('muestra el message en español que envían los servicios', () => {
    expect(mensajeDeError(errorHttp(409, 'No se puede pasar a EN_CLASE sin CONFIRMAR')))
      .toBe('No se puede pasar a EN_CLASE sin CONFIRMAR');
    expect(mensajeDeError(errorHttp(403, 'El rol [Socio] no tiene permiso para POST /api/catalog/services')))
      .toBe('El rol [Socio] no tiene permiso para POST /api/catalog/services');
  });

  it('en un 401 agrega el motivo del BFF y pide volver a iniciar sesión', () => {
    expect(mensajeDeError(errorHttp(401, 'El token expiró el 2026-09-29T10:00:00Z')))
      .toBe('Tu sesión no es válida: El token expiró el 2026-09-29T10:00:00Z. Vuelve a iniciar sesión.');
  });

  it('sin conexión (status 0) da un mensaje claro', () => {
    expect(mensajeDeError(errorHttp(0))).toContain('No se pudo conectar con el servidor');
  });

  it('sin cuerpo JSON usa un texto por defecto', () => {
    expect(mensajeDeError(errorHttp(403))).toBe('No tienes permiso para esta operación.');
    expect(mensajeDeError(errorHttp(500))).toBe('Error 500: x');
  });
});
