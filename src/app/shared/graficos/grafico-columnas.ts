import { Component, computed, input, signal } from '@angular/core';
import { marcasEje } from '../../core/reportes';

/**
 * Gráfico de columnas de una sola serie (sin leyenda: el título de la tarjeta dice qué se grafica).
 * - Columnas de hasta 24px con el extremo superior redondeado, desde una única línea base.
 * - Grilla horizontal fina y recesiva; solo se etiqueta el valor máximo.
 * - Cada columna es enfocable: el tooltip aparece con el mouse y con el teclado.
 * - La tabla con todos los valores queda disponible en "Ver como tabla".
 */
@Component({
  selector: 'app-grafico-columnas',
  template: `
    <div class="grafico" role="group" [attr.aria-label]="descripcion()">
      <div class="eje-y" aria-hidden="true">
        @for (m of marcasInvertidas(); track m) {
          <span>{{ m }}</span>
        }
      </div>
      <div class="area">
        @for (m of marcas(); track m) {
          <div class="grilla" [style.bottom.%]="(m / tope()) * 100" aria-hidden="true"></div>
        }
        <div class="columnas">
          @for (valor of valores(); track $index) {
            <div class="celda"
                 tabindex="0"
                 [attr.aria-label]="etiquetas()[$index] + ': ' + valor + ' ' + unidad()"
                 (mouseenter)="activa.set($index)" (mouseleave)="activa.set(null)"
                 (focus)="activa.set($index)" (blur)="activa.set(null)">
              @if ($index === indiceMaximo() && valor > 0) {
                <span class="etiqueta-max" [style.bottom.%]="(valor / tope()) * 100">{{ valor }}</span>
              }
              <div class="columna" [class.resaltada]="activa() === $index"
                   [style.height.%]="(valor / tope()) * 100"></div>
              @if (activa() === $index) {
                <div class="tooltip" role="tooltip">
                  <strong>{{ valor }}</strong> {{ unidad() }}
                  <span>{{ etiquetas()[$index] }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
      <div class="eje-x" aria-hidden="true">
        @for (e of etiquetas(); track $index) {
          <span>{{ $index % cadaCuantasEtiquetas() === 0 ? e : '' }}</span>
        }
      </div>
    </div>
    <details>
      <summary>Ver como tabla</summary>
      <table class="tabla">
        <thead><tr><th>{{ nombreEje() }}</th><th class="numero">{{ unidad() }}</th></tr></thead>
        <tbody>
          @for (valor of valores(); track $index) {
            <tr><td>{{ etiquetas()[$index] }}</td><td class="numero">{{ valor }}</td></tr>
          }
        </tbody>
      </table>
    </details>
  `,
  styles: `
    .grafico {
      display: grid;
      /* minmax(0, 1fr): sin esto, las 24 etiquetas del eje X ensanchan el gráfico y desbordan en móvil */
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-rows: 200px auto;
      column-gap: 0.5rem;
    }
    .eje-y {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--texto-tenue);
      font-variant-numeric: tabular-nums;
      text-align: right;
      transform: translateY(-0.5em);
      height: calc(100% + 1em);
      margin-bottom: -1em;
    }
    .area {
      position: relative;
      border-bottom: 1px solid var(--eje);
    }
    .grilla {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px solid var(--grilla);
    }
    .columnas {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-end;
      gap: 2px;
    }
    .celda {
      position: relative;
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      cursor: default;
      outline-offset: -2px;
    }
    .columna {
      width: min(24px, 80%);
      background: var(--serie);
      border-radius: 4px 4px 0 0;
      min-height: 0;
    }
    .columna.resaltada {
      filter: brightness(1.15);
    }
    .etiqueta-max {
      position: absolute;
      margin-bottom: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--texto);
    }
    .tooltip {
      position: absolute;
      bottom: calc(100% - 2.5rem);
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      white-space: nowrap;
      background: var(--superficie);
      border: 1px solid var(--borde-fuerte);
      border-radius: 6px;
      padding: 0.25rem 0.5rem;
      font-size: 0.8125rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      pointer-events: none;
    }
    .tooltip span {
      display: block;
      color: var(--texto-2);
      font-size: 0.75rem;
    }
    .eje-x {
      grid-column: 2;
      display: flex;
      gap: 2px;
      font-size: 0.75rem;
      color: var(--texto-tenue);
      padding-top: 0.25rem;
    }
    .eje-x span {
      flex: 1;
      min-width: 0;
      text-align: center;
      white-space: nowrap;
      overflow: visible;
    }
    details {
      margin-top: 0.75rem;
      font-size: 0.875rem;
    }
    summary {
      cursor: pointer;
      color: var(--texto-2);
    }
  `,
})
export class GraficoColumnas {
  readonly valores = input.required<number[]>();
  readonly etiquetas = input.required<string[]>();
  readonly unidad = input('reservas');
  readonly nombreEje = input('Hora');
  readonly descripcion = input('Gráfico de columnas');

  protected readonly activa = signal<number | null>(null);
  protected readonly marcas = computed(() => marcasEje(Math.max(0, ...this.valores())));
  protected readonly marcasInvertidas = computed(() => [...this.marcas()].reverse());
  protected readonly tope = computed(() => this.marcas()[this.marcas().length - 1]);
  protected readonly indiceMaximo = computed(() => {
    const v = this.valores();
    return v.indexOf(Math.max(...v));
  });
  /** Con muchas columnas, se muestra una etiqueta del eje X cada N para que no choquen. */
  protected readonly cadaCuantasEtiquetas = computed(() => Math.ceil(this.valores().length / 8));
}
