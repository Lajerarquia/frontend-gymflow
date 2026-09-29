import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { SesionService } from '../../auth/sesion.service';
import { CatalogoApi } from '../../core/api/catalogo-api';
import { MeApi } from '../../core/api/me-api';
import { ReservasApi } from '../../core/api/reservas-api';
import { eventosDe } from '../../core/auditoria';
import { Avisos } from '../../core/avisos';
import { mensajeDeError } from '../../core/errores';
import { ACCION_ESTADO, ETIQUETA_ESTADO, accionesPermitidas } from '../../core/estados';
import { Clase, EstadoReserva, Me, Reserva } from '../../core/modelos';
import { tasaOcupacion } from '../../core/reportes';

const ACTIVAS: EstadoReserva[] = ['CONFIRMADA', 'EN_ESPERA', 'EN_CLASE'];

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  protected readonly sesion = inject(SesionService);
  private readonly reservasApi = inject(ReservasApi);
  private readonly catalogoApi = inject(CatalogoApi);
  private readonly meApi = inject(MeApi);
  private readonly avisos = inject(Avisos);

  protected readonly etiqueta = ETIQUETA_ESTADO;
  protected readonly accion = ACCION_ESTADO;

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly clases = signal<Clase[]>([]);
  protected readonly me = signal<Me | null>(null);
  protected readonly errorMe = signal<string | null>(null);
  protected readonly procesando = signal<number | null>(null);

  protected readonly esAdmin = computed(() => this.sesion.tieneRol('Admin'));
  protected readonly esInstructor = computed(() => this.sesion.tieneRol('Instructor'));
  protected readonly esSocio = computed(() => this.sesion.tieneRol('Socio'));
  protected readonly esAuditor = computed(() => this.sesion.tieneRol('Auditor'));
  protected readonly sinRoles = computed(() => (this.sesion.usuario()?.roles.length ?? 0) === 0);

  // ---- Admin: cifras de la cadena ----
  protected readonly reservasHoy = computed(() => {
    const inicioDelDia = new Date();
    inicioDelDia.setHours(0, 0, 0, 0);
    return this.reservas().filter((r) => new Date(r.createdAt) >= inicioDelDia).length;
  });
  protected readonly activas = computed(() => this.reservas().filter((r) => ACTIVAS.includes(r.status)).length);
  protected readonly proximasClases = computed(() =>
    this.clases().filter((c) => new Date(c.startsAt) > new Date()),
  );
  protected readonly ocupacion = computed(() => tasaOcupacion(this.proximasClases()));

  // ---- Instructor ----
  protected readonly porConfirmar = computed(() =>
    this.reservas()
      .filter((r) => r.status === 'RESERVADA')
      .sort((a, b) => Date.parse(a.classStartsAt) - Date.parse(b.classStartsAt)),
  );
  protected readonly enCurso = computed(() => this.reservas().filter((r) => r.status === 'EN_CLASE'));

  // ---- Socio: sus próximas clases (el BFF ya filtra por su oid) ----
  protected readonly misProximas = computed(() => {
    const oid = this.sesion.usuario()?.oid;
    return this.reservas()
      .filter((r) => r.memberId === oid && r.status !== 'CANCELADA' && r.status !== 'COMPLETADA')
      .filter((r) => new Date(r.classStartsAt) > new Date(Date.now() - 3 * 3600_000))
      .sort((a, b) => Date.parse(a.classStartsAt) - Date.parse(b.classStartsAt));
  });

  // ---- Auditor ----
  protected readonly ultimosEventos = computed(() => eventosDe(this.reservas()).slice(0, 10));

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    if (this.sinRoles()) {
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      reservas: this.reservasApi.listar(),
      clases: this.esAdmin() ? this.catalogoApi.listarClases() : of([] as Clase[]),
    }).subscribe({
      next: ({ reservas, clases }) => {
        this.reservas.set(reservas);
        this.clases.set(clases);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected acciones(reserva: Reserva): EstadoReserva[] {
    return accionesPermitidas(reserva, this.sesion.usuario());
  }

  protected cambiarEstado(reserva: Reserva, estado: EstadoReserva): void {
    this.procesando.set(reserva.id);
    this.reservasApi.cambiarEstado(reserva.id, estado).subscribe({
      next: (actualizada) => {
        this.reservas.update((lista) => lista.map((r) => (r.id === actualizada.id ? actualizada : r)));
        this.avisos.exito(`Reserva de ${actualizada.memberName}: ${ETIQUETA_ESTADO[actualizada.status]}`);
        this.procesando.set(null);
      },
      error: (e) => {
        this.avisos.error(mensajeDeError(e));
        this.procesando.set(null);
      },
    });
  }

  /** Llama al BFF con el token: comprueba de punta a punta que el Gateway y el BFF aceptan el JWT. */
  protected probarApi(): void {
    this.errorMe.set(null);
    this.meApi.obtener().subscribe({
      next: (me) => this.me.set(me),
      error: (e) => {
        this.me.set(null);
        this.errorMe.set(mensajeDeError(e));
      },
    });
  }
}
