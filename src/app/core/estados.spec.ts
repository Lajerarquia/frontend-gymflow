import { Rol, Usuario } from '../auth/roles';
import { usuarioDesdeClaims } from '../auth/sesion.service';
import { TRANSICIONES, accionesPermitidas } from './estados';
import { EstadoReserva, Reserva } from './modelos';

function usuario(oid: string, ...roles: Rol[]): Usuario {
  return { oid, nombre: oid, email: '', roles, scopes: ['access_as_user'], expira: null };
}

function reserva(status: EstadoReserva, memberId = 'oid-socio'): Reserva {
  return {
    id: 1, classId: 7, className: 'Spinning', classStartsAt: '2026-10-01T11:00:00Z', memberId, memberName: 'José',
    status, createdBy: 'José', createdById: memberId, createdAt: '2026-09-29T10:00:00Z',
    updatedBy: 'José', updatedById: memberId, updatedAt: '2026-09-29T10:00:00Z',
  };
}

describe('estados de la reserva', () => {
  it('la tabla es la misma que la de ms-gymflow-reservations', () => {
    expect(TRANSICIONES).toEqual({
      RESERVADA: ['CONFIRMADA', 'CANCELADA'],
      CONFIRMADA: ['EN_ESPERA', 'EN_CLASE', 'CANCELADA'],
      EN_ESPERA: ['EN_CLASE', 'CANCELADA'],
      EN_CLASE: ['COMPLETADA'],
      COMPLETADA: [],
      CANCELADA: [],
    });
  });

  it('no ofrece pasar a EN_CLASE desde RESERVADA (hay que confirmar antes)', () => {
    expect(accionesPermitidas(reserva('RESERVADA'), usuario('i', 'Instructor'))).not.toContain('EN_CLASE');
  });

  it('Admin e Instructor ven todas las transiciones válidas', () => {
    expect(accionesPermitidas(reserva('CONFIRMADA'), usuario('i', 'Instructor'))).toEqual(['EN_ESPERA', 'EN_CLASE', 'CANCELADA']);
    expect(accionesPermitidas(reserva('EN_CLASE'), usuario('a', 'Admin'))).toEqual(['COMPLETADA']);
  });

  it('el Socio solo puede cancelar, y solo sus propias reservas', () => {
    const socio = usuario('oid-socio', 'Socio');
    expect(accionesPermitidas(reserva('CONFIRMADA'), socio)).toEqual(['CANCELADA']);
    expect(accionesPermitidas(reserva('CONFIRMADA', 'oid-otro'), socio)).toEqual([]);
    expect(accionesPermitidas(reserva('EN_CLASE'), socio)).toEqual([]);
  });

  it('el Auditor no tiene acciones', () => {
    expect(accionesPermitidas(reserva('RESERVADA'), usuario('x', 'Auditor'))).toEqual([]);
  });
});

describe('usuarioDesdeClaims', () => {
  it('toma roles y scopes de los claims e ignora roles que no son de GymFlow', () => {
    const u = usuarioDesdeClaims(
      { oid: 'oid-1', name: 'Ana Díaz', preferred_username: 'ana@gymflow.cl', roles: ['Admin', 'Otro'], scp: 'access_as_user', exp: 1_800_000_000 },
      null,
    );
    expect(u.roles).toEqual(['Admin']);
    expect(u.scopes).toEqual(['access_as_user']);
    expect(u.nombre).toBe('Ana Díaz');
    expect(u.expira?.getTime()).toBe(1_800_000_000_000);
  });
});
