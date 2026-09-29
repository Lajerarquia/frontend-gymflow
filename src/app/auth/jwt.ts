/** Claims del access token de Azure AD que usa el frontend. */
export interface ClaimsToken {
  oid?: string;
  name?: string;
  preferred_username?: string;
  /** App Roles asignados al usuario (Admin, Instructor, Socio, Auditor). */
  roles?: string[];
  /** Scopes delegados, separados por espacio (ej. "access_as_user"). */
  scp?: string;
  tid?: string;
  aud?: string;
  exp?: number;
  [claim: string]: unknown;
}

/**
 * Decodifica el payload de un JWT como UTF-8.
 *
 * `atob` devuelve un "binary string" (un carácter por byte): "José" en UTF-8 son 5 bytes y atob los
 * convierte en "JosÃ©". Por eso los bytes se pasan por `TextDecoder`. Además el JWT usa base64url
 * ("-" y "_" en vez de "+" y "/", sin relleno "="), que atob no acepta tal cual.
 *
 * Solo se LEE el token para mostrar datos y decidir qué pantallas ver; la firma la valida el backend.
 */
export function decodificarJwt(token: string): ClaimsToken {
  const partes = token.split('.');
  if (partes.length < 2) {
    throw new Error('El token no tiene formato JWT');
  }
  const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
  const conRelleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binario = atob(conRelleno);
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder('utf-8').decode(bytes)) as ClaimsToken;
}

/** El claim scp viene como texto separado por espacios; lo devuelve como lista. */
export function scopesDe(claims: ClaimsToken): string[] {
  return (claims.scp ?? '').split(' ').filter((s) => s.length > 0);
}
