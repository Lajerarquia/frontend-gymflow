import { OPCIONES_ROUTING, opcionesDe, payloadDeEjemplo, tipoSugerido } from './mq';

describe('opciones de /admin/mq', () => {
  it('ofrece routing keys solo del exchange elegido', () => {
    expect(opcionesDe('cmd.direct').every((o) => o.exchange === 'cmd.direct')).toBeTrue();
    expect(opcionesDe('cmd.topic').map((o) => o.routingKey)).toContain('checkin.ticket.created');
  });

  it('marca sin cola las keys que no calzan con ningún binding', () => {
    const sinCola = OPCIONES_ROUTING.filter((o) => o.cola === null).map((o) => `${o.exchange} ${o.routingKey}`);
    expect(sinCola).toEqual(['cmd.direct email.reminder', 'cmd.topic email.send.urgent']);
  });

  it('sugiere el tipo según el flujo de la routing key', () => {
    expect(tipoSugerido('email.send')).toBe('EMAIL_RESERVA_CONFIRMADA');
    expect(tipoSugerido('checkin.ticket.created')).toBe('CHECKIN_TICKET_CREADO');
    expect(tipoSugerido('invoice.gen')).toBe('INVOICE_GENERAR');
    expect(tipoSugerido('otra.cosa')).toBe('MENSAJE_PRUEBA');
  });

  it('el payload de email lleva el destinatario (si no, notify lo manda a la DLQ)', () => {
    const payload = payloadDeEjemplo('EMAIL_RESERVA_CONFIRMADA', 'admin@gymflow.cl') as { memberEmail: string };
    expect(payload.memberEmail).toBe('admin@gymflow.cl');
  });
});
