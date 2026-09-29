import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CatalogoApi } from '../../core/api/catalogo-api';
import { ReservasApi } from '../../core/api/reservas-api';
import { mensajeDeError } from '../../core/errores';
import { Clase, Reserva } from '../../core/modelos';
import {
  clasesMasDemandadas,
  contarPorEstado,
  ocupacionPorClase,
  reservasPorHora,
  tasaOcupacion,
} from '../../core/reportes';
import { BarrasRanking, FilaRanking } from '../../shared/graficos/barras-ranking';
import { GraficoColumnas } from '../../shared/graficos/grafico-columnas';

type Periodo = 'hoy' | '7d' | '30d';

const PERIODOS: { valor: Periodo; texto: string }[] = [
  { valor: 'hoy', texto: 'Hoy' },
  { valor: '7d', texto: 'Últimos 7 días' },
  { valor: '30d', texto: 'Últimos 30 días' },
];

/**
 * Reportería calculada en el frontend con datos reales de /api/reservations y /api/catalog/services.
 * En la EP2 estos datos vendrán ya agregados desde ms-gymflow-report, alimentado por Kafka.
 */
@Component({
  selector: 'app-reports',
  imports: [DatePipe, GraficoColumnas, BarrasRanking],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  private readonly reservasApi = inject(ReservasApi);
  private readonly catalogoApi = inject(CatalogoApi);

  protected readonly periodos = PERIODOS;
  protected readonly periodo = signal<Periodo>('7d');
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actualizado = signal<Date | null>(null);
  private readonly reservas = signal<Reserva[]>([]);
  private readonly clases = signal<Clase[]>([]);

  protected readonly horas = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);
  protected readonly porHora = computed(() => reservasPorHora(this.reservas()));

  protected readonly conteo = computed(() => contarPorEstado(this.reservas()));
  protected readonly total = computed(() => this.reservas().length);
  protected readonly canceladas = computed(() => this.conteo()['CANCELADA'] ?? 0);
  protected readonly confirmadas = computed(
    () => ['CONFIRMADA', 'EN_ESPERA', 'EN_CLASE', 'COMPLETADA'].reduce((s, e) => s + (this.conteo()[e] ?? 0), 0),
  );

  private readonly proximas = computed(() => this.clases().filter((c) => new Date(c.startsAt) > new Date()));
  protected readonly ocupacionRed = computed(() => tasaOcupacion(this.proximas()));

  protected readonly filasOcupacion = computed<FilaRanking[]>(() =>
    ocupacionPorClase(this.proximas())
      .slice(0, 8)
      .map((o) => ({
        clave: o.id,
        etiqueta: o.nombre,
        detalle: `${o.sala} · ${new Date(o.inicio).toLocaleString('es-CL', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        valor: o.porcentaje,
        texto: `${o.ocupados} de ${o.capacidad} · ${o.porcentaje} %`,
      })),
  );

  protected readonly filasDemanda = computed<FilaRanking[]>(() =>
    clasesMasDemandadas(this.reservas(), 5).map((d) => ({
      clave: d.classId,
      etiqueta: d.nombre,
      valor: d.reservas,
      texto: `${d.reservas} ${d.reservas === 1 ? 'reserva' : 'reservas'}`,
    })),
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected elegirPeriodo(periodo: Periodo): void {
    this.periodo.set(periodo);
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      reservas: this.reservasApi.listar({ from: inicioDelPeriodo(this.periodo()).toISOString() }),
      clases: this.catalogoApi.listarClases(),
    }).subscribe({
      next: ({ reservas, clases }) => {
        this.reservas.set(reservas);
        this.clases.set(clases);
        this.actualizado.set(new Date());
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }
}

function inicioDelPeriodo(periodo: Periodo): Date {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  if (periodo === '7d') {
    inicio.setDate(inicio.getDate() - 6);
  } else if (periodo === '30d') {
    inicio.setDate(inicio.getDate() - 29);
  }
  return inicio;
}
