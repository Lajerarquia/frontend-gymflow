/**
 * Conversión entre `<input type="datetime-local">` (hora local, sin zona) y las fechas ISO-8601 en UTC
 * que usan los servicios.
 */

/** "2026-10-01T08:00" (hora local) → "2026-10-01T11:00:00.000Z". Vacío → undefined. */
export function localAIso(valor: string | null | undefined): string | undefined {
  if (!valor) {
    return undefined;
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? undefined : fecha.toISOString();
}

/** Fecha ISO → valor para `<input type="datetime-local">` en hora local. */
export function isoALocal(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const fecha = new Date(iso);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}
