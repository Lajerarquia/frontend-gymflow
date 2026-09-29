import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SesionService } from '../../auth/sesion.service';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <section class="tarjeta">
      <h1>No tienes permiso para esta pantalla</h1>
      <p>
        Tus roles:
        @for (rol of sesion.usuario()?.roles ?? []; track rol) {
          <span class="chip">{{ rol }}</span>
        } @empty {
          <strong>ninguno asignado</strong>.
        }
      </p>
      <p class="tenue">Si necesitas acceso, pide a un administrador que te asigne el rol en Azure AD.</p>
      <a routerLink="/dashboard" class="btn">Volver al inicio</a>
    </section>
  `,
})
export class Forbidden {
  protected readonly sesion = inject(SesionService);
}
