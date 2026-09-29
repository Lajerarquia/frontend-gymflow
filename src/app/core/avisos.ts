import { Injectable, signal } from '@angular/core';

export type TipoAviso = 'error' | 'info' | 'exito';

export interface Aviso {
  id: number;
  tipo: TipoAviso;
  texto: string;
}

/**
 * Avisos globales que se muestran arriba de cualquier pantalla. Los errores de autenticación y de red
 * llegan aquí, para que nunca dejen la aplicación en blanco.
 */
@Injectable({ providedIn: 'root' })
export class Avisos {
  private siguienteId = 1;
  readonly lista = signal<Aviso[]>([]);

  error(texto: string): void {
    this.agregar('error', texto);
  }

  info(texto: string): void {
    this.agregar('info', texto);
  }

  exito(texto: string): void {
    this.agregar('exito', texto, 4000);
  }

  cerrar(id: number): void {
    this.lista.update((avisos) => avisos.filter((a) => a.id !== id));
  }

  private agregar(tipo: TipoAviso, texto: string, cierreAutomaticoMs?: number): void {
    // No repetir el mismo aviso si ya está en pantalla
    if (this.lista().some((a) => a.tipo === tipo && a.texto === texto)) {
      return;
    }
    const id = this.siguienteId++;
    this.lista.update((avisos) => [...avisos, { id, tipo, texto }]);
    if (cierreAutomaticoMs) {
      setTimeout(() => this.cerrar(id), cierreAutomaticoMs);
    }
  }
}
