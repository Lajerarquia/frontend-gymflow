import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Rol, tieneAlgunRol } from '../../auth/roles';
import { SesionService } from '../../auth/sesion.service';

interface Enlace {
  ruta: string;
  texto: string;
  roles?: Rol[];
}

/** Mismos roles que las rutas: el menú solo muestra lo que el usuario puede abrir. */
const ENLACES: Enlace[] = [
  { ruta: '/dashboard', texto: 'Inicio' },
  { ruta: '/reservations', texto: 'Reservas', roles: ['Admin', 'Instructor', 'Socio'] },
  { ruta: '/catalog', texto: 'Catálogo', roles: ['Admin', 'Instructor'] },
  { ruta: '/reports', texto: 'Reportería', roles: ['Admin'] },
  { ruta: '/audit', texto: 'Auditoría', roles: ['Admin', 'Auditor'] },
];

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="barra">
      <div class="interior">
        <a routerLink="/dashboard" class="marca">GymFlow</a>
        <nav aria-label="Principal">
          @for (enlace of enlaces(); track enlace.ruta) {
            <a [routerLink]="enlace.ruta" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: false }">
              {{ enlace.texto }}
            </a>
          }
        </nav>
        <div class="usuario">
          <div class="identidad">
            <span class="nombre">{{ sesion.usuario()?.nombre }}</span>
            <span class="roles">
              @for (rol of sesion.usuario()?.roles ?? []; track rol) {
                <span class="chip">{{ rol }}</span>
              } @empty {
                <span class="chip">Sin rol</span>
              }
            </span>
          </div>
          <button type="button" class="btn btn-chico" (click)="sesion.cerrarSesion()">Cerrar sesión</button>
        </div>
      </div>
    </header>
  `,
  styles: `
    .barra {
      background: var(--superficie);
      border-bottom: 1px solid var(--borde);
    }
    .interior {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.5rem 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 1.25rem;
    }
    .marca {
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--texto);
      text-decoration: none;
    }
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      flex: 1;
    }
    nav a {
      color: var(--texto-2);
      text-decoration: none;
      padding: 0.375rem 0.625rem;
      border-radius: 6px;
      font-weight: 500;
    }
    nav a:hover {
      background: var(--superficie-2);
    }
    nav a.activo {
      color: var(--texto);
      background: var(--acento-suave);
    }
    .usuario {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .identidad {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
    }
    .nombre {
      font-weight: 600;
      font-size: 0.875rem;
    }
    .roles {
      display: flex;
      gap: 0.25rem;
      margin-top: 2px;
    }
  `,
})
export class Navbar {
  protected readonly sesion = inject(SesionService);
  protected readonly enlaces = computed(() =>
    ENLACES.filter((e) => tieneAlgunRol(this.sesion.usuario(), e.roles)),
  );
}
