import { ExchangeMq } from './modelos';

/**
 * Opciones de la pantalla /admin/mq: qué routing keys ofrecer en cada exchange y a qué cola llegan según la
 * topología del caso (sección 8). Sirven para mostrar la diferencia entre el binding exacto de cmd.direct y los
 * comodines de cmd.topic (`*` = una palabra, `#` = cero o más).
 */
export interface OpcionRouting {
  exchange: ExchangeMq;
  routingKey: string;
  /** Cola a la que llega, o null si ningún binding calza (mq-admin responde 422). */
  cola: string | null;
  explicacion: string;
}

export const OPCIONES_ROUTING: readonly OpcionRouting[] = [
  { exchange: 'cmd.direct', routingKey: 'email.send', cola: 'q.cmd.email', explicacion: 'binding exacto email.send' },
  { exchange: 'cmd.direct', routingKey: 'checkin.ticket', cola: 'q.cmd.checkin', explicacion: 'binding exacto checkin.ticket' },
  { exchange: 'cmd.direct', routingKey: 'invoice.gen', cola: 'q.cmd.invoice', explicacion: 'binding exacto invoice.gen' },
  { exchange: 'cmd.direct', routingKey: 'email.reminder', cola: null, explicacion: 'direct no usa comodines: ninguna cola' },
  { exchange: 'cmd.topic', routingKey: 'email.reminder', cola: 'q.cmd.email', explicacion: 'calza con email.*' },
  { exchange: 'cmd.topic', routingKey: 'checkin.ticket.created', cola: 'q.cmd.checkin', explicacion: 'calza con checkin.#' },
  { exchange: 'cmd.topic', routingKey: 'invoice.monthly', cola: 'q.cmd.invoice', explicacion: 'calza con invoice.*' },
  { exchange: 'cmd.topic', routingKey: 'email.send.urgent', cola: null, explicacion: 'email.* es una sola palabra: ninguna cola' },
];

export const EXCHANGES: readonly ExchangeMq[] = ['cmd.direct', 'cmd.topic'];

export function opcionesDe(exchange: ExchangeMq): OpcionRouting[] {
  return OPCIONES_ROUTING.filter((o) => o.exchange === exchange);
}

export type TipoMensajeMq = 'EMAIL_RESERVA_CONFIRMADA' | 'CHECKIN_TICKET_CREADO' | 'INVOICE_GENERAR' | 'MENSAJE_PRUEBA';

export const TIPOS_MENSAJE: readonly { tipo: TipoMensajeMq; explicacion: string }[] = [
  { tipo: 'EMAIL_RESERVA_CONFIRMADA', explicacion: 'notify registra el [EMAIL] y hace ACK' },
  { tipo: 'CHECKIN_TICKET_CREADO', explicacion: 'notify registra el [TICKET] y hace ACK' },
  { tipo: 'INVOICE_GENERAR', explicacion: 'notify registra el [INVOICE] y hace ACK' },
  { tipo: 'MENSAJE_PRUEBA', explicacion: 'notify no lo conoce: NACK y va a la DLQ' },
];

/** Tipo que corresponde al flujo de la routing key (email.*, checkin.*, invoice.*). */
export function tipoSugerido(routingKey: string): TipoMensajeMq {
  if (routingKey.startsWith('email.')) {
    return 'EMAIL_RESERVA_CONFIRMADA';
  }
  if (routingKey.startsWith('checkin.')) {
    return 'CHECKIN_TICKET_CREADO';
  }
  if (routingKey.startsWith('invoice.')) {
    return 'INVOICE_GENERAR';
  }
  return 'MENSAJE_PRUEBA';
}

/** Payload de ejemplo con los campos que espera notify para cada tipo (los mismos que publica reservations). */
export function payloadDeEjemplo(tipo: TipoMensajeMq, emailDestino: string): unknown {
  const clase = { classId: 0, className: 'Clase de prueba (mq-admin)', classStartsAt: new Date(Date.now() + 86_400_000).toISOString() };
  switch (tipo) {
    case 'EMAIL_RESERVA_CONFIRMADA':
      return { reservationId: 0, memberId: 'prueba', memberName: 'Socio de prueba', memberEmail: emailDestino, ...clase };
    case 'CHECKIN_TICKET_CREADO':
      return { reservationId: 0, memberId: 'prueba', memberName: 'Socio de prueba', confirmedBy: 'mq-admin', ...clase };
    case 'INVOICE_GENERAR':
      return { socio: 'Socio de prueba', plan: 'PLUS', periodo: new Date().toISOString().slice(0, 7) };
    case 'MENSAJE_PRUEBA':
      return { nota: 'Mensaje de prueba desde /admin/mq' };
  }
}
