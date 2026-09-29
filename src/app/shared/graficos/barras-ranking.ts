import { Component, computed, input } from '@angular/core';

export interface FilaRanking {
  clave: string | number;
  etiqueta: string;
  detalle?: string;
  valor: number;
  /** Texto del valor al final de la barra (ej. "12 de 20 · 60 %"). */
  texto: string;
}

/**
 * Barras horizontales de una sola serie, ordenadas de mayor a menor, con el valor al final de cada barra.
 * - modo "medidor": la barra se dibuja sobre una pista del mismo azul más claro (relación contra un máximo, ej. 100 %).
 * - modo "ranking": sin pista; la barra más larga es el máximo de los datos.
 */
@Component({
  selector: 'app-barras-ranking',
  template: `
    <ol class="lista" [attr.aria-label]="descripcion()">
      @for (fila of filas(); track fila.clave) {
        <li class="fila" [attr.aria-label]="fila.etiqueta + ': ' + fila.texto" tabindex="0" [attr.title]="fila.etiqueta + ': ' + fila.texto">
          <div class="nombre">
            <span class="etiqueta">{{ fila.etiqueta }}</span>
            @if (fila.detalle) { <span class="detalle">{{ fila.detalle }}</span> }
          </div>
          <div class="barra-y-valor">
            <div class="pista" [class.con-pista]="modo() === 'medidor'">
              <div class="barra" [style.width.%]="ancho(fila.valor)"></div>
            </div>
            <span class="valor">{{ fila.texto }}</span>
          </div>
        </li>
      } @empty {
        <li class="vacio">{{ textoVacio() }}</li>
      }
    </ol>
  `,
  styles: `
    .lista {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    .fila {
      display: grid;
      grid-template-columns: minmax(0, 11rem) 1fr;
      gap: 0.75rem;
      align-items: center;
      border-radius: 6px;
      outline-offset: 2px;
    }
    .fila:hover .barra,
    .fila:focus .barra {
      filter: brightness(1.15);
    }
    .nombre {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .etiqueta {
      font-size: 0.875rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .detalle {
      font-size: 0.75rem;
      color: var(--texto-tenue);
    }
    .barra-y-valor {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }
    .pista {
      flex: 1;
      height: 16px;
      border-radius: 0 4px 4px 0;
    }
    .pista.con-pista {
      background: var(--pista);
    }
    .barra {
      height: 100%;
      background: var(--serie);
      border-radius: 0 4px 4px 0;
      min-width: 2px;
    }
    .valor {
      flex: none;
      min-width: 6.5rem;
      font-size: 0.8125rem;
      color: var(--texto-2);
      font-variant-numeric: tabular-nums;
    }
    @media (max-width: 520px) {
      .fila {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
    }
  `,
})
export class BarrasRanking {
  readonly filas = input.required<FilaRanking[]>();
  readonly modo = input<'medidor' | 'ranking'>('ranking');
  /** En modo medidor, el valor que llena la pista (100 para porcentajes). */
  readonly maximo = input<number | null>(null);
  readonly descripcion = input('Ranking');
  readonly textoVacio = input('Sin datos');

  private readonly tope = computed(() => this.maximo() ?? Math.max(1, ...this.filas().map((f) => f.valor)));

  protected ancho(valor: number): number {
    return Math.min(100, (valor / this.tope()) * 100);
  }
}
