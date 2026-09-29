import { Component, inject } from '@angular/core';
import { Avisos } from '../../core/avisos';

/** Muestra los avisos globales (errores de sesión, de red, confirmaciones). */
@Component({
  selector: 'app-avisos-barra',
  template: `
    <div class="avisos" aria-live="polite">
      @for (aviso of avisos.lista(); track aviso.id) {
        <div class="aviso aviso-{{ aviso.tipo }}" [attr.role]="aviso.tipo === 'error' ? 'alert' : 'status'">
          <span class="icono" aria-hidden="true">{{ aviso.tipo === 'error' ? '!' : aviso.tipo === 'exito' ? '✓' : 'i' }}</span>
          <span class="texto">{{ aviso.texto }}</span>
          <button type="button" class="cerrar" (click)="avisos.cerrar(aviso.id)" aria-label="Cerrar aviso">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .avisos {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }
    .aviso {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      margin-top: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--borde);
      background: var(--info-suave);
    }
    .aviso-error {
      background: var(--peligro-suave);
      border-color: var(--peligro);
    }
    .aviso-exito {
      background: var(--exito-suave);
    }
    .icono {
      flex: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--superficie);
      border: 1px solid currentColor;
    }
    .aviso-error .icono {
      color: var(--peligro);
    }
    .texto {
      flex: 1;
    }
    .cerrar {
      flex: none;
      border: none;
      background: transparent;
      color: var(--texto-2);
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 0.25rem;
    }
  `,
})
export class AvisosBarra {
  protected readonly avisos = inject(Avisos);
}
