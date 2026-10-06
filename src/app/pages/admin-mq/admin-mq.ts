import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SesionService } from '../../auth/sesion.service';
import { MqAdminApi } from '../../core/api/mq-admin-api';
import { Avisos } from '../../core/avisos';
import { mensajeDeError } from '../../core/errores';
import { ColaMq, ExchangeMq } from '../../core/modelos';
import { EXCHANGES, TIPOS_MENSAJE, TipoMensajeMq, opcionesDe, payloadDeEjemplo, tipoSugerido } from '../../core/mq';

/**
 * Administración de RabbitMQ (EP2), solo Admin. Todo pasa por el BFF (/api/admin/mq/**) hacia ms-gymflow-mq-admin,
 * que no publica puertos: estado de las colas, mensaje de prueba y reproceso de las DLQ.
 */
@Component({
  selector: 'app-admin-mq',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-mq.html',
})
export class AdminMq implements OnInit {
  private readonly api = inject(MqAdminApi);
  private readonly avisos = inject(Avisos);
  private readonly sesion = inject(SesionService);
  private readonly fb = inject(FormBuilder);

  /** La API de Management actualiza los contadores cada ~5 s: se recarga un poco después de cada acción. */
  private static readonly ESPERA_ESTADISTICAS_MS = 6000;

  protected readonly exchanges = EXCHANGES;
  protected readonly tipos = TIPOS_MENSAJE;

  protected readonly colas = signal<ColaMq[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly publicando = signal(false);
  /** Nombre de la DLQ que se está reprocesando (para deshabilitar solo ese botón). */
  protected readonly reprocesando = signal<string | null>(null);
  protected readonly ultimoEventId = signal<string | null>(null);
  protected readonly actualizado = signal<Date | null>(null);

  protected readonly principales = computed(() => this.colas().filter((c) => !c.dlqDe));
  protected readonly dlqs = computed(() => this.colas().filter((c) => !!c.dlqDe));
  protected readonly totalEnDlq = computed(() => this.dlqs().reduce((total, c) => total + c.messages, 0));

  protected readonly form = this.fb.nonNullable.group({
    exchange: 'cmd.direct' as ExchangeMq,
    routingKey: 'email.send',
    type: 'EMAIL_RESERVA_CONFIRMADA' as TipoMensajeMq,
    repetirEventId: false,
  });

  private readonly exchangeElegido = toSignal(this.form.controls.exchange.valueChanges, {
    initialValue: this.form.controls.exchange.value,
  });
  private readonly routingElegida = toSignal(this.form.controls.routingKey.valueChanges, {
    initialValue: this.form.controls.routingKey.value,
  });

  protected readonly opcionesRouting = computed(() => opcionesDe(this.exchangeElegido()));
  protected readonly destino = computed(
    () => this.opcionesRouting().find((o) => o.routingKey === this.routingElegida()) ?? null,
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.listarColas().subscribe({
      next: (colas) => {
        this.colas.set(colas);
        this.actualizado.set(new Date());
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  /** Al cambiar de exchange, se elige su primera routing key y el tipo que le corresponde. */
  protected cambiarExchange(): void {
    const primera = this.opcionesRouting()[0];
    this.form.patchValue({ routingKey: primera.routingKey, type: tipoSugerido(primera.routingKey) });
  }

  protected cambiarRouting(): void {
    this.form.controls.type.setValue(tipoSugerido(this.form.controls.routingKey.value));
  }

  protected publicar(): void {
    const v = this.form.getRawValue();
    const eventId = v.repetirEventId ? (this.ultimoEventId() ?? undefined) : undefined;
    this.publicando.set(true);
    this.api
      .publicarPrueba({
        exchange: v.exchange,
        routingKey: v.routingKey,
        type: v.type,
        eventId,
        payload: payloadDeEjemplo(v.type, this.sesion.usuario()?.email || 'admin@gymflow.cl'),
      })
      .subscribe({
        next: (r) => {
          this.publicando.set(false);
          this.ultimoEventId.set(r.eventId);
          this.avisos.exito(`Publicado ${r.type} en ${r.exchange} (${r.routingKey}). eventId ${r.eventId.slice(0, 8)}…`);
          this.recargarDespues();
        },
        error: (e) => {
          this.publicando.set(false);
          // 422: ninguna cola enlazada con esa routing key (el mensaje se descartó)
          this.avisos.error(mensajeDeError(e));
        },
      });
  }

  protected reprocesar(cola: ColaMq): void {
    if (!confirm(`¿Devolver los mensajes de ${cola.name} a ${cola.dlqDe}?`)) {
      return;
    }
    this.reprocesando.set(cola.name);
    this.api.reprocesar(cola.name).subscribe({
      next: (r) => {
        this.reprocesando.set(null);
        this.avisos.exito(`${r.movidos} mensaje(s) devueltos de ${r.dlq} a ${r.destino}`);
        this.recargarDespues();
      },
      error: (e) => {
        this.reprocesando.set(null);
        this.avisos.error(mensajeDeError(e));
      },
    });
  }

  private recargarDespues(): void {
    setTimeout(() => this.cargar(), AdminMq.ESPERA_ESTADISTICAS_MS);
  }
}
