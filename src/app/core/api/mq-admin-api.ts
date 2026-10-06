import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColaMq, MensajePruebaMq, ResultadoPublicacionMq, ResultadoReprocesoMq } from '../modelos';

/**
 * Administración de RabbitMQ a través del API Gateway → BFF (/api/admin/mq/**, solo Admin) → ms-gymflow-mq-admin.
 * El MsalInterceptor agrega el access token porque la ruta calza con `${apiBaseUrl}/api/*`.
 */
@Injectable({ providedIn: 'root' })
export class MqAdminApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/admin/mq`;

  listarColas(): Observable<ColaMq[]> {
    return this.http.get<ColaMq[]>(`${this.base}/queues`);
  }

  publicarPrueba(mensaje: MensajePruebaMq): Observable<ResultadoPublicacionMq> {
    return this.http.post<ResultadoPublicacionMq>(`${this.base}/test-messages`, mensaje);
  }

  reprocesar(dlq: string): Observable<ResultadoReprocesoMq> {
    return this.http.post<ResultadoReprocesoMq>(`${this.base}/queues/${encodeURIComponent(dlq)}/reprocess`, null);
  }
}
