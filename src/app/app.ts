import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { SesionService } from './auth/sesion.service';
import { Avisos } from './core/avisos';
import { AvisosBarra } from './shared/avisos-barra/avisos-barra';
import { Navbar } from './shared/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, AvisosBarra],
  template: `
    @if (sesion.autenticado()) {
      <app-navbar />
    }
    <app-avisos-barra />
    <main class="contenido">
      <router-outlet />
    </main>
  `,
})
export class App implements OnInit {
  protected readonly sesion = inject(SesionService);
  private readonly msal = inject(MsalService);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  /**
   * Procesa la respuesta de Azure AD cuando la página vuelve del login (redirect).
   * Debe ejecutarse en cada carga: inicializa MSAL y, si hay un #code en la URL, lo canjea por los tokens.
   */
  ngOnInit(): void {
    this.msal.handleRedirectObservable().subscribe({
      next: (resultado) => {
        if (resultado?.account) {
          this.msal.instance.setActiveAccount(resultado.account);
        }
      },
      error: (e: unknown) => {
        this.avisos.error('No se pudo completar el inicio de sesión: ' + (e instanceof Error ? e.message : String(e)));
        void this.router.navigate(['/login']);
      },
    });
  }
}
