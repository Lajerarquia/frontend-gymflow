import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { gestionaReservas } from '../../auth/roles';
import { SesionService } from '../../auth/sesion.service';
import { CatalogoApi } from '../../core/api/catalogo-api';
import { ReservasApi } from '../../core/api/reservas-api';
import { Avisos } from '../../core/avisos';
import { mensajeDeError } from '../../core/errores';
import { ACCION_ESTADO, ESTADOS, ETIQUETA_ESTADO, accionesPermitidas } from '../../core/estados';
import { localAIso } from '../../core/fechas';
import { Clase, EstadoReserva, FiltrosReserva, NuevaReserva, Reserva } from '../../core/modelos';

@Component({
  selector: 'app-reservations',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './reservations.html',
})
export class Reservations implements OnInit {
  protected readonly sesion = inject(SesionService);
  private readonly reservasApi = inject(ReservasApi);
  private readonly catalogoApi = inject(CatalogoApi);
  private readonly avisos = inject(Avisos);
  private readonly fb = inject(FormBuilder);

  protected readonly estados = ESTADOS;
  protected readonly etiqueta = ETIQUETA_ESTADO;
  protected readonly accion = ACCION_ESTADO;

  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly clases = signal<Clase[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly procesando = signal<number | null>(null);

  /** Admin e Instructor reservan para un socio y pueden filtrar por socio; el Socio solo ve y crea las suyas. */
  protected readonly esStaff = computed(() => gestionaReservas(this.sesion.usuario()));
  protected readonly clasesFuturas = computed(() =>
    this.clases().filter((c) => new Date(c.startsAt) > new Date()),
  );

  protected readonly filtros = this.fb.nonNullable.group({
    status: '' as EstadoReserva | '',
    classId: '',
    memberId: '',
    from: '',
    to: '',
  });

  protected readonly nueva = this.fb.nonNullable.group({
    classId: ['', Validators.required],
    memberId: [''],
    memberName: [''],
    memberEmail: [''],
  });

  ngOnInit(): void {
    if (this.esStaff()) {
      // Para reservar a nombre de un socio hay que indicar quién es y a qué email avisarle cuando se confirme
      // (sin email, la notificación de RabbitMQ termina en la DLQ).
      this.nueva.controls.memberId.addValidators(Validators.required);
      this.nueva.controls.memberName.addValidators(Validators.required);
      this.nueva.controls.memberEmail.addValidators([Validators.required, Validators.email, Validators.maxLength(254)]);
    }
    this.catalogoApi.listarClases().subscribe({
      next: (clases) => this.clases.set(clases),
      error: (e) => this.avisos.error('No se pudo cargar el catálogo: ' + mensajeDeError(e)),
    });
    this.buscar();
  }

  protected buscar(): void {
    const f = this.filtros.getRawValue();
    const consulta: FiltrosReserva = {
      status: f.status || undefined,
      classId: f.classId ? Number(f.classId) : undefined,
      memberId: this.esStaff() ? f.memberId.trim() || undefined : undefined,
      from: localAIso(f.from),
      to: localAIso(f.to),
    };
    this.cargando.set(true);
    this.error.set(null);
    this.reservasApi.listar(consulta).subscribe({
      next: (reservas) => {
        this.reservas.set(reservas);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected limpiarFiltros(): void {
    this.filtros.reset();
    this.buscar();
  }

  protected reservar(): void {
    if (this.nueva.invalid) {
      this.nueva.markAllAsTouched();
      return;
    }
    const v = this.nueva.getRawValue();
    const datos: NuevaReserva = { classId: Number(v.classId) };
    if (this.esStaff()) {
      datos.memberId = v.memberId.trim();
      datos.memberName = v.memberName.trim();
      datos.memberEmail = v.memberEmail.trim();
    }
    this.guardando.set(true);
    this.reservasApi.crear(datos).subscribe({
      next: (creada) => {
        this.guardando.set(false);
        this.nueva.reset();
        this.reservas.update((lista) => [creada, ...lista]);
        this.avisos.exito(`Reserva creada en ${creada.className}`);
      },
      error: (e) => {
        this.guardando.set(false);
        this.avisos.error(mensajeDeError(e));
      },
    });
  }

  protected acciones(reserva: Reserva): EstadoReserva[] {
    return accionesPermitidas(reserva, this.sesion.usuario());
  }

  protected cambiarEstado(reserva: Reserva, estado: EstadoReserva): void {
    if (estado === 'CANCELADA' && !confirm(`¿Cancelar la reserva de ${reserva.memberName} en ${reserva.className}?`)) {
      return;
    }
    this.procesando.set(reserva.id);
    this.reservasApi.cambiarEstado(reserva.id, estado).subscribe({
      next: (actualizada) => {
        this.reservas.update((lista) => lista.map((r) => (r.id === actualizada.id ? actualizada : r)));
        this.avisos.exito(`Reserva #${actualizada.id}: ${ETIQUETA_ESTADO[actualizada.status]}`);
        this.procesando.set(null);
      },
      error: (e) => {
        this.avisos.error(mensajeDeError(e));
        this.procesando.set(null);
      },
    });
  }
}
