import { EstadoReserva, Reserva } from './modelos';

/** "CREADA" o el estado al que pasó la reserva. */
export type TipoEvento = 'CREADA' | EstadoReserva;

export interface EventoAuditoria {
  clave: string;
  reservaId: number;
  tipo: TipoEvento;
  usuario: string;
  usuarioId: string;
  fecha: string;
  socio: string;
  clase: string;
}

export interface FiltrosAuditoria {
  /** Texto a buscar en el nombre o el id de quien hizo el evento (sin distinguir tildes ni mayúsculas). */
  usuario?: string;
  desde?: Date | null;
  hasta?: Date | null;
  tipo?: TipoEvento | '';
}

/**
 * Arma el timeline a partir de las reservas (EP1):
 * - un evento "CREADA" con createdBy/createdAt;
 * - si la reserva cambió después, un evento con su estado actual y updatedBy/updatedAt.
 *
 * Con estos campos solo se ve el ÚLTIMO cambio de cada reserva, no los intermedios. En la EP2 el
 * historial completo vendrá de ms-gymflow-audit, alimentado por Kafka (tópico audit.timeline).
 */
export function eventosDe(reservas: Reserva[]): EventoAuditoria[] {
  const eventos: EventoAuditoria[] = [];
  for (const r of reservas) {
    eventos.push({
      clave: `${r.id}-creada`,
      reservaId: r.id,
      tipo: 'CREADA',
      usuario: r.createdBy,
      usuarioId: r.createdById,
      fecha: r.createdAt,
      socio: r.memberName,
      clase: r.className,
    });
    if (r.updatedAt !== r.createdAt) {
      eventos.push({
        clave: `${r.id}-${r.status}`,
        reservaId: r.id,
        tipo: r.status,
        usuario: r.updatedBy,
        usuarioId: r.updatedById,
        fecha: r.updatedAt,
        socio: r.memberName,
        clase: r.className,
      });
    }
  }
  return eventos.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
}

export function filtrarEventos(eventos: EventoAuditoria[], filtros: FiltrosAuditoria): EventoAuditoria[] {
  const texto = normalizar(filtros.usuario ?? '');
  return eventos.filter((e) => {
    if (texto && !normalizar(e.usuario).includes(texto) && !normalizar(e.usuarioId).includes(texto)) {
      return false;
    }
    if (filtros.tipo && e.tipo !== filtros.tipo) {
      return false;
    }
    const fecha = Date.parse(e.fecha);
    if (filtros.desde && fecha < filtros.desde.getTime()) {
      return false;
    }
    if (filtros.hasta && fecha >= filtros.hasta.getTime()) {
      return false;
    }
    return true;
  });
}

/** "José PÉREZ" → "jose perez", para buscar sin importar tildes ni mayúsculas. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
