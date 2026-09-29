import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Me } from '../modelos';

/** GET /api/me: lo que el BFF entendió del token (sirve para comprobar el flujo completo). */
@Injectable({ providedIn: 'root' })
export class MeApi {
  private readonly http = inject(HttpClient);

  obtener(): Observable<Me> {
    return this.http.get<Me>(`${environment.apiBaseUrl}/api/me`);
  }
}
