import { decodificarJwt, scopesDe } from './jwt';

/** Arma un JWT (sin firma real) con el payload dado, codificado en base64url como lo hace Azure AD. */
function tokenCon(payload: object): string {
  const base64url = (texto: string) => {
    const bytes = new TextEncoder().encode(texto);
    const binario = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  return `${base64url('{"alg":"RS256","typ":"JWT"}')}.${base64url(JSON.stringify(payload))}.firma`;
}

describe('decodificarJwt', () => {
  it('decodifica nombres con tildes y ñ como UTF-8 (atob solo los rompería)', () => {
    const claims = decodificarJwt(tokenCon({ name: 'José Pérez Muñoz', roles: ['Socio'] }));

    expect(claims.name).toBe('José Pérez Muñoz');
    expect(claims.roles).toEqual(['Socio']);
  });

  it('acepta base64url con "-" y "_" y sin relleno', () => {
    // "~~~" y "???" producen "+" y "/" en base64 estándar
    const claims = decodificarJwt(tokenCon({ oid: 'abc', extra: '~~~???>>>' }));

    expect(claims.oid).toBe('abc');
    expect(claims['extra']).toBe('~~~???>>>');
  });

  it('rechaza un texto que no es JWT', () => {
    expect(() => decodificarJwt('no-es-un-jwt')).toThrowError('El token no tiene formato JWT');
  });

  it('separa los scopes del claim scp', () => {
    expect(scopesDe({ scp: 'access_as_user  otro.scope' })).toEqual(['access_as_user', 'otro.scope']);
    expect(scopesDe({})).toEqual([]);
  });
});
