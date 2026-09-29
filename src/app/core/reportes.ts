import { Clase, Reserva } from './modelos';

/**
 * Cálculos de /reports hechos en el frontend con datos reales de /api/reservations y
 * /api/catalog/services (EP1). En la EP2 vendrán ya agregados desde ms-gymflow-report vía Kafka.
 */

export interface OcupacionClase {
  id: number;
  nombre: string;
  sala: string;
  inicio: string;
  ocupados: number;
  capacidad: number;
  /** 0 a 100. */
  porcentaje: number;
}

export interface DemandaClase {
  classId: number;
  nombre: string;
  reservas: number;
}

/** Reservas creadas en cada hora del día (0 a 23), en la hora local del navegador. */
export function reservasPorHora(reservas: Reserva[]): number[] {
  const horas = new Array<number>(24).fill(0);
  for (const r of reservas) {
    horas[new Date(r.createdAt).getHours()]++;
  }
  return horas;
}

/** Ocupación de cada clase (cupos confirmados / cupo), de mayor a menor. */
export function ocupacionPorClase(clases: Clase[]): OcupacionClase[] {
  return clases
    .map((c) => ({
      id: c.id,
      nombre: c.name,
      sala: c.roomName,
      inicio: c.startsAt,
      ocupados: c.occupiedSlots,
      capacidad: c.capacity,
      porcentaje: c.capacity > 0 ? Math.round((c.occupiedSlots / c.capacity) * 100) : 0,
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje || b.ocupados - a.ocupados);
}

/** Tasa de ocupación de la red: total de cupos ocupados / total de cupos. 0 a 100. */
export function tasaOcupacion(clases: Clase[]): number {
  const capacidad = clases.reduce((suma, c) => suma + c.capacity, 0);
  const ocupados = clases.reduce((suma, c) => suma + c.occupiedSlots, 0);
  return capacidad > 0 ? Math.round((ocupados / capacidad) * 100) : 0;
}

/** Clases con más reservas (sin contar las canceladas). */
export function clasesMasDemandadas(reservas: Reserva[], cantidad = 5): DemandaClase[] {
  const porClase = new Map<number, DemandaClase>();
  for (const r of reservas) {
    if (r.status === 'CANCELADA') {
      continue;
    }
    const actual = porClase.get(r.classId) ?? { classId: r.classId, nombre: r.className, reservas: 0 };
    actual.reservas++;
    porClase.set(r.classId, actual);
  }
  return [...porClase.values()]
    .sort((a, b) => b.reservas - a.reservas || a.nombre.localeCompare(b.nombre))
    .slice(0, cantidad);
}

/** Cuenta reservas por estado (para las cifras del resumen). */
export function contarPorEstado(reservas: Reserva[]): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const r of reservas) {
    conteo[r.status] = (conteo[r.status] ?? 0) + 1;
  }
  return conteo;
}

/**
 * Marcas limpias para el eje Y (0, 2, 4... / 0, 5, 10... / 0, 10, 20...), con el máximo redondeado hacia arriba.
 * Devuelve siempre al menos [0, 1] para que un gráfico vacío tenga escala.
 */
export function marcasEje(maximo: number, cantidadDeseada = 4): number[] {
  if (maximo <= 0) {
    return [0, 1];
  }
  const pasoBruto = maximo / cantidadDeseada;
  const magnitud = Math.pow(10, Math.floor(Math.log10(pasoBruto)));
  const paso = [1, 2, 5, 10].map((m) => m * magnitud).find((p) => p >= pasoBruto) ?? 10 * magnitud;
  const pasoEntero = Math.max(1, Math.round(paso));
  const tope = Math.ceil(maximo / pasoEntero) * pasoEntero;
  const marcas: number[] = [];
  for (let v = 0; v <= tope; v += pasoEntero) {
    marcas.push(v);
  }
  return marcas;
}
