import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Clase, DatosClase, DatosSala, Sala } from '../modelos';

/** Catálogo (clases y salas) a través del API Gateway → BFF. */
@Injectable({ providedIn: 'root' })
export class CatalogoApi {
  private readonly http = inject(HttpClient);
  private readonly clases = `${environment.apiBaseUrl}/api/catalog/services`;
  private readonly salas = `${environment.apiBaseUrl}/api/catalog/rooms`;

  listarClases(filtros: { from?: string; to?: string; roomId?: number } = {}): Observable<Clase[]> {
    let params = new HttpParams();
    for (const [nombre, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(nombre, String(valor));
      }
    }
    return this.http.get<Clase[]>(this.clases, { params });
  }

  crearClase(datos: DatosClase): Observable<Clase> {
    return this.http.post<Clase>(this.clases, datos);
  }

  actualizarClase(id: number, datos: DatosClase): Observable<Clase> {
    return this.http.put<Clase>(`${this.clases}/${id}`, datos);
  }

  eliminarClase(id: number): Observable<void> {
    return this.http.delete<void>(`${this.clases}/${id}`);
  }

  listarSalas(): Observable<Sala[]> {
    return this.http.get<Sala[]>(this.salas);
  }

  crearSala(datos: DatosSala): Observable<Sala> {
    return this.http.post<Sala>(this.salas, datos);
  }

  actualizarSala(id: number, datos: DatosSala): Observable<Sala> {
    return this.http.put<Sala>(`${this.salas}/${id}`, datos);
  }

  eliminarSala(id: number): Observable<void> {
    return this.http.delete<void>(`${this.salas}/${id}`);
  }
}
