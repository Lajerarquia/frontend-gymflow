import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ReservasApi } from '../../core/api/reservas-api';
import { EventoAuditoria, TipoEvento, eventosDe, filtrarEventos } from '../../core/auditoria';
import { mensajeDeError } from '../../core/errores';
import { ESTADOS, ETIQUETA_ESTADO } from '../../core/estados';
import { localAIso } from '../../core/fechas';

@Component({
  selector: 'app-audit',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './audit.html',
})
export class Audit implements OnInit {
  private readonly reservasApi = inject(ReservasApi);
  private readonly fb = inject(FormBuilder);

  protected readonly tipos: TipoEvento[] = ['CREADA', ...ESTADOS];
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly eventos = signal<EventoAuditoria[]>([]);

  protected readonly filtros = this.fb.nonNullable.group({
    usuario: '',
    tipo: '' as TipoEvento | '',
    desde: '',
    hasta: '',
  });
  private readonly valoresFiltro = toSignal(this.filtros.valueChanges, { initialValue: this.filtros.getRawValue() });

  /** Los filtros se aplican al instante, sin volver a llamar al API. */
  protected readonly visibles = computed(() => {
    const f = this.valoresFiltro();
    const desde = localAIso(f.desde);
    const hasta = localAIso(f.hasta);
    return filtrarEventos(this.eventos(), {
      usuario: f.usuario,
      tipo: f.tipo,
      desde: desde ? new Date(desde) : null,
      hasta: hasta ? new Date(hasta) : null,
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reservasApi.listar().subscribe({
      next: (reservas) => {
        this.eventos.set(eventosDe(reservas));
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  protected etiquetaTipo(tipo: TipoEvento): string {
    return tipo === 'CREADA' ? 'Creada' : ETIQUETA_ESTADO[tipo];
  }
}
