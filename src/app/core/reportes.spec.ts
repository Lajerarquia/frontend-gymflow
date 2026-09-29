import { eventosDe, filtrarEventos, normalizar } from './auditoria';
import { Clase, EstadoReserva, Reserva } from './modelos';
import { clasesMasDemandadas, marcasEje, ocupacionPorClase, reservasPorHora, tasaOcupacion } from './reportes';

function reserva(id: number, classId: number, status: EstadoReserva, createdAt: string, updatedAt = createdAt): Reserva {
  return {
    id, classId, className: `Clase ${classId}`, classStartsAt: '2026-10-01T11:00:00Z',
    memberId: `oid-${id}`, memberName: `Socio ${id}`, status,
    createdBy: 'José Pérez', createdById: 'oid-jose', createdAt,
    updatedBy: 'Camila Rojas', updatedById: 'oid-camila', updatedAt,
  };
}

function clase(id: number, capacidad: number, ocupados: number): Clase {
  return {
    id, name: `Clase ${id}`, description: null, instructor: 'Camila', roomId: 1, roomName: 'Sala A', branch: 'Centro',
    startsAt: '2026-10-01T11:00:00Z', endsAt: '2026-10-01T12:00:00Z', durationMinutes: 60,
    capacity: capacidad, availableSlots: capacidad - ocupados, occupiedSlots: ocupados, plan: 'BASICO',
  };
}

/** Fecha ISO para una hora local dada (los reportes agrupan por la hora local del navegador). */
function aLas(hora: number, minuto = 0): string {
  const fecha = new Date(2026, 8, 29, hora, minuto);
  return fecha.toISOString();
}

describe('reportes', () => {
  it('cuenta las reservas por hora local de creación', () => {
    const horas = reservasPorHora([
      reserva(1, 7, 'RESERVADA', aLas(9, 5)),
      reserva(2, 7, 'RESERVADA', aLas(9, 55)),
      reserva(3, 8, 'CANCELADA', aLas(18, 30)),
    ]);

    expect(horas.length).toBe(24);
    expect(horas[9]).toBe(2);
    expect(horas[18]).toBe(1);
    expect(horas.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('ordena la ocupación de mayor a menor y calcula el porcentaje', () => {
    const ocupacion = ocupacionPorClase([clase(1, 20, 5), clase(2, 10, 9), clase(3, 4, 0)]);

    expect(ocupacion.map((o) => o.id)).toEqual([2, 1, 3]);
    expect(ocupacion[0].porcentaje).toBe(90);
    expect(ocupacion[1].porcentaje).toBe(25);
  });

  it('la tasa de la red pondera por cupo (no promedia porcentajes)', () => {
    // 14 ocupados de 34 cupos = 41 %, no el promedio de 25 %, 90 % y 0 %
    expect(tasaOcupacion([clase(1, 20, 5), clase(2, 10, 9), clase(3, 4, 0)])).toBe(41);
    expect(tasaOcupacion([])).toBe(0);
  });

  it('las clases más demandadas no cuentan reservas canceladas', () => {
    const top = clasesMasDemandadas([
      reserva(1, 7, 'CONFIRMADA', aLas(9)),
      reserva(2, 7, 'RESERVADA', aLas(9)),
      reserva(3, 8, 'RESERVADA', aLas(9)),
      reserva(4, 8, 'CANCELADA', aLas(9)),
      reserva(5, 8, 'CANCELADA', aLas(9)),
    ]);

    expect(top).toEqual([
      { classId: 7, nombre: 'Clase 7', reservas: 2 },
      { classId: 8, nombre: 'Clase 8', reservas: 1 },
    ]);
  });

  it('las marcas del eje son números limpios que cubren el máximo', () => {
    expect(marcasEje(0)).toEqual([0, 1]);
    expect(marcasEje(3)).toEqual([0, 1, 2, 3]);
    expect(marcasEje(7)).toEqual([0, 2, 4, 6, 8]);
    expect(marcasEje(37)).toEqual([0, 10, 20, 30, 40]);
  });
});

describe('auditoría', () => {
  it('cada reserva da un evento de creación y, si cambió, uno con su último estado', () => {
    const eventos = eventosDe([
      reserva(1, 7, 'CONFIRMADA', '2026-09-29T10:00:00Z', '2026-09-29T11:00:00Z'),
      reserva(2, 7, 'RESERVADA', '2026-09-29T10:30:00Z'),
    ]);

    expect(eventos.map((e) => `${e.reservaId}:${e.tipo}:${e.usuario}`)).toEqual([
      '1:CONFIRMADA:Camila Rojas',
      '2:CREADA:José Pérez',
      '1:CREADA:José Pérez',
    ]);
  });

  it('filtra por usuario sin importar tildes ni mayúsculas, por tipo y por fecha', () => {
    const eventos = eventosDe([
      reserva(1, 7, 'CONFIRMADA', '2026-09-29T10:00:00Z', '2026-09-29T11:00:00Z'),
      reserva(2, 7, 'RESERVADA', '2026-09-29T12:00:00Z'),
    ]);

    expect(filtrarEventos(eventos, { usuario: 'jose perez' }).length).toBe(2);
    expect(filtrarEventos(eventos, { usuario: 'oid-camila' }).length).toBe(1);
    expect(filtrarEventos(eventos, { tipo: 'CONFIRMADA' }).map((e) => e.reservaId)).toEqual([1]);
    expect(filtrarEventos(eventos, { desde: new Date('2026-09-29T10:30:00Z') }).length).toBe(2);
    expect(filtrarEventos(eventos, { hasta: new Date('2026-09-29T10:30:00Z') }).length).toBe(1);
  });

  it('normaliza texto para buscar', () => {
    expect(normalizar('  José PÉREZ Muñoz ')).toBe('jose perez munoz');
  });
});
