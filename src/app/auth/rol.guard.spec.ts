import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { rolGuard } from './rol.guard';
import { Rol, Usuario } from './roles';
import { SesionService } from './sesion.service';

describe('rolGuard', () => {
  let usuario: Usuario | null;

  function ejecutar(roles?: Rol[]): Promise<boolean | UrlTree> {
    const ruta = { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(
      () => rolGuard(ruta, {} as RouterStateSnapshot) as Promise<boolean | UrlTree>,
    );
  }

  function conRoles(...roles: Rol[]): Usuario {
    return { oid: 'oid', nombre: 'José', email: 'jose@gymflow.cl', roles, scopes: ['access_as_user'], expira: null };
  }

  beforeEach(() => {
    usuario = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SesionService, useValue: { cargar: () => Promise.resolve(usuario) } },
      ],
    });
  });

  it('sin sesión devuelve false y deja que MsalGuard lleve al login', async () => {
    expect(await ejecutar(['Admin'])).toBeFalse();
  });

  it('deja pasar si el usuario tiene alguno de los roles de la ruta', async () => {
    usuario = conRoles('Socio', 'Auditor');
    expect(await ejecutar(['Admin', 'Auditor'])).toBeTrue();
  });

  it('manda a /forbidden si ningún rol calza', async () => {
    usuario = conRoles('Socio');
    const resultado = await ejecutar(['Admin']);

    const router = TestBed.inject(Router);
    expect(resultado instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/forbidden');
  });

  it('una ruta sin roles solo exige estar autenticado, aunque no tenga roles', async () => {
    usuario = conRoles();
    expect(await ejecutar()).toBeTrue();
  });
});
