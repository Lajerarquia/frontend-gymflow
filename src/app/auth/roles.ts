/** App Roles del App Registration "GymFlow" (claim roles). */
export type Rol = 'Admin' | 'Instructor' | 'Socio' | 'Auditor';

export const ROLES: readonly Rol[] = ['Admin', 'Instructor', 'Socio', 'Auditor'];

/** Usuario autenticado, armado desde los claims del access token. */
export interface Usuario {
  oid: string;
  nombre: string;
  email: string;
  roles: Rol[];
  scopes: string[];
  /** Vencimiento del access token (para mostrarlo; la renovación la hace MSAL). */
  expira: Date | null;
}

export function tieneAlgunRol(usuario: Usuario | null, permitidos: readonly Rol[] | undefined): boolean {
  if (!usuario) {
    return false;
  }
  if (!permitidos || permitidos.length === 0) {
    return true;
  }
  return usuario.roles.some((rol) => permitidos.includes(rol));
}

/** Admin e Instructor gestionan reservas de cualquier socio; un Socio solo las suyas. */
export function gestionaReservas(usuario: Usuario | null): boolean {
  return tieneAlgunRol(usuario, ['Admin', 'Instructor']);
}

/** Filtra y tipa los roles que vienen en el token, ignorando los que no son de GymFlow. */
export function rolesValidos(roles: unknown): Rol[] {
  if (!Array.isArray(roles)) {
    return [];
  }
  return roles.filter((r): r is Rol => ROLES.includes(r as Rol));
}
