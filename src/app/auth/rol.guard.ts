import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol, tieneAlgunRol } from './roles';
import { SesionService } from './sesion.service';

/**
 * Guard de roles. Va DESPUÉS de MsalGuard en cada ruta protegida:
 * - MsalGuard asegura que haya sesión (si no, redirige a Azure AD);
 * - este guard lee los roles del access token y compara con `data.roles` de la ruta.
 *   Sin roles en la ruta = cualquier usuario autenticado.
 *
 * Es solo experiencia de usuario: quien decide de verdad es el BFF, que responde 403 si el rol no alcanza.
 */
export const rolGuard: CanActivateFn = async (ruta) => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  const usuario = await sesion.cargar();
  if (!usuario) {
    return false; // MsalGuard ya está llevando al usuario al login
  }
  const permitidos = ruta.data?.['roles'] as Rol[] | undefined;
  if (tieneAlgunRol(usuario, permitidos)) {
    return true;
  }
  return router.createUrlTree(['/forbidden']);
};
