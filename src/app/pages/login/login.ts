import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { filter } from 'rxjs';
import { configuracionPendiente } from '../../auth/msal.config';
import { SesionService } from '../../auth/sesion.service';

/**
 * Pantalla pública de inicio de sesión, en '' (la redirectUri registrada) y en /login.
 * Cuando Azure AD devuelve la respuesta, se espera a que MSAL termine de procesarla
 * (InteractionStatus.None) y, si hay sesión, se va al dashboard.
 */
@Component({
  selector: 'app-login',
  template: `
    <section class="login">
      <div class="tarjeta panel">
        <h1>GymFlow</h1>
        <p class="subtitulo">Reserva de clases y equipamiento de la red de gimnasios.</p>

        @if (pendiente) {
          <div class="configuracion" role="alert">
            <strong>Falta configurar Azure AD.</strong>
            Reemplaza <code>&lt;TENANT_ID&gt;</code> y <code>&lt;CLIENT_ID&gt;</code> en
            <code>src/environments/</code> con los datos del App Registration "GymFlow".
          </div>
        }

        <button type="button" class="btn btn-primario grande" (click)="sesion.iniciarSesion()"
                [disabled]="ocupado() || pendiente">
          {{ ocupado() ? 'Conectando con Microsoft…' : 'Iniciar sesión con Microsoft' }}
        </button>
        <p class="tenue">Usa tu cuenta corporativa. Tus permisos dependen del rol asignado en Azure AD.</p>
      </div>
    </section>
  `,
  styles: `
    .login {
      min-height: 70vh;
      display: grid;
      place-items: center;
    }
    .panel {
      width: min(100%, 420px);
      text-align: center;
      padding: 2rem 1.5rem;
    }
    h1 {
      font-size: 2rem;
    }
    .grande {
      width: 100%;
      min-height: 44px;
      margin: 1.25rem 0 0.75rem;
      font-size: 1rem;
    }
    .configuracion {
      margin-top: 1rem;
      text-align: left;
      padding: 0.75rem;
      border-radius: 8px;
      background: var(--peligro-suave);
      border: 1px solid var(--peligro);
      font-size: 0.875rem;
    }
  `,
})
export class Login implements OnInit {
  protected readonly sesion = inject(SesionService);
  private readonly broadcast = inject(MsalBroadcastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pendiente = configuracionPendiente;
  protected readonly ocupado = signal(true);

  ngOnInit(): void {
    this.broadcast.inProgress$
      .pipe(
        filter((estado) => estado === InteractionStatus.None),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.ocupado.set(false);
        if (this.sesion.cuentaActiva()) {
          void this.router.navigate(['/dashboard']);
        }
      });
  }
}
