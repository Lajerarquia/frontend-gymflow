/**
 * Tipos de la API. Calzan campo por campo con los DTO de ms-gymflow-reservations y ms-gymflow-catalog
 * (ver "Contratos entre servicios" en CLAUDE.md); el BFF los reenvía sin cambios.
 */

export type EstadoReserva = 'RESERVADA' | 'CONFIRMADA' | 'EN_ESPERA' | 'EN_CLASE' | 'COMPLETADA' | 'CANCELADA';

export type Plan = 'BASICO' | 'PLUS' | 'PREMIUM';

export interface Reserva {
  id: number;
  classId: number;
  className: string;
  classStartsAt: string;
  memberId: string;
  memberName: string;
  /** Destinatario de las notificaciones (EP2). Las reservas anteriores a la EP2 no lo tienen. */
  memberEmail?: string | null;
  status: EstadoReserva;
  createdBy: string;
  createdById: string;
  createdAt: string;
  updatedBy: string;
  updatedById: string;
  updatedAt: string;
}

export interface NuevaReserva {
  classId: number;
  /** Solo lo usan Admin e Instructor; para un Socio el BFF pone sus propios datos. */
  memberId?: string;
  memberName?: string;
  /** Email del socio para la notificación de confirmación. Si reserva el Socio, se usa el de su token. */
  memberEmail?: string;
}

export interface FiltrosReserva {
  status?: EstadoReserva;
  memberId?: string;
  classId?: number;
  /** ISO-8601, sobre la fecha de creación. */
  from?: string;
  to?: string;
}

export interface Clase {
  id: number;
  name: string;
  description: string | null;
  instructor: string;
  roomId: number;
  roomName: string;
  branch: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  capacity: number;
  availableSlots: number;
  occupiedSlots: number;
  plan: Plan;
}

export interface DatosClase {
  name: string;
  description: string | null;
  instructor: string;
  roomId: number;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  plan: Plan;
}

export interface Sala {
  id: number;
  name: string;
  branch: string;
  capacity: number;
}

export type DatosSala = Omit<Sala, 'id'>;

/** Respuesta de GET /api/me del BFF: lo que el backend entendió del token. */
export interface Me {
  oid: string;
  nombre: string;
  email: string;
  roles: string[];
  scopes: string[];
  tenant: string;
  emisor: string;
  audiencia: string[];
  expira: string;
}

/** Formato de error de todos los servicios. */
export interface ErrorApi {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
