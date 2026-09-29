import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoReserva, FiltrosReserva, NuevaReserva, Reserva } from '../modelos';

/**
 * Reservas a través del API Gateway → BFF. El token lo agrega el MsalInterceptor: aquí no se toca.
 */
@Injectable({ providedIn: 'root' })
export class ReservasApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/api/reservations`;

  listar(filtros: FiltrosReserva = {}): Observable<Reserva[]> {
    let params = new HttpParams();
    for (const [nombre, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(nombre, String(valor));
      }
    }
    return this.http.get<Reserva[]>(this.url, { params });
  }

  obtener(id: number): Observable<Reserva> {
    return this.http.get<Reserva>(`${this.url}/${id}`);
  }

  crear(datos: NuevaReserva): Observable<Reserva> {
    return this.http.post<Reserva>(this.url, datos);
  }

  cambiarEstado(id: number, status: EstadoReserva): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.url}/${id}/status`, { status });
  }
}
