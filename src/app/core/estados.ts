import { Usuario, gestionaReservas } from '../auth/roles';
import { EstadoReserva, Reserva } from './modelos';

/**
 * Copia de la tabla de transiciones de ms-gymflow-reservations (EstadoReserva.java).
 * Solo sirve para mostrar los botones que tienen sentido; el backend vuelve a validar y responde 409.
 */
export const TRANSICIONES: Record<EstadoReserva, EstadoReserva[]> = {
  RESERVADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EN_ESPERA', 'EN_CLASE', 'CANCELADA'],
  EN_ESPERA: ['EN_CLASE', 'CANCELADA'],
  EN_CLASE: ['COMPLETADA'],
  COMPLETADA: [],
  CANCELADA: [],
};

export const ESTADOS: EstadoReserva[] = ['RESERVADA', 'CONFIRMADA', 'EN_ESPERA', 'EN_CLASE', 'COMPLETADA', 'CANCELADA'];

export const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  RESERVADA: 'Reservada',
  CONFIRMADA: 'Confirmada',
  EN_ESPERA: 'En espera',
  EN_CLASE: 'En clase',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

/** Texto del botón que lleva a cada estado. */
export const ACCION_ESTADO: Record<EstadoReserva, string> = {
  RESERVADA: 'Reservar',
  CONFIRMADA: 'Confirmar',
  EN_ESPERA: 'Registrar ingreso',
  EN_CLASE: 'Iniciar clase',
  COMPLETADA: 'Completar',
  CANCELADA: 'Cancelar',
};

/**
 * Qué cambios de estado puede hacer este usuario sobre esta reserva (mismas reglas que el BFF):
 * - Admin e Instructor: cualquier transición válida.
 * - Socio: solo CANCELADA, y solo sobre sus propias reservas.
 * - Auditor: ninguno (solo lectura).
 */
export function accionesPermitidas(reserva: Reserva, usuario: Usuario | null): EstadoReserva[] {
  const siguientes = TRANSICIONES[reserva.status];
  if (!usuario) {
    return [];
  }
  if (gestionaReservas(usuario)) {
    return siguientes;
  }
  if (usuario.roles.includes('Socio') && reserva.memberId === usuario.oid) {
    return siguientes.filter((estado) => estado === 'CANCELADA');
  }
  return [];
}
