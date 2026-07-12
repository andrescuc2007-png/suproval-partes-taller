import { DIAS_RETRASO, ESTADOS_FINALES } from "./constants";
import type { ParteTaller } from "./types";

// Días transcurridos desde una fecha ISO (YYYY-MM-DD) hasta hoy.
export function diasDesde(fechaISO: string): number {
  const inicio = new Date(fechaISO + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ms = hoy.getTime() - inicio.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ¿El parte está en un estado final?
export function esFinal(parte: Pick<ParteTaller, "estado_reparacion">): boolean {
  return ESTADOS_FINALES.includes(parte.estado_reparacion);
}

// Un parte está "retrasado" si NO ha llegado a un estado final
// y lleva más de DIAS_RETRASO días desde su fecha.
export function esRetrasado(
  parte: Pick<ParteTaller, "estado_reparacion" | "fecha">
): boolean {
  if (esFinal(parte)) return false;
  return diasDesde(parte.fecha) > DIAS_RETRASO;
}

export interface ResumenPartes {
  total: number;
  activos: number;
  retrasados: number;
  entregados: number;
}

export function calcularResumen(partes: ParteTaller[]): ResumenPartes {
  let activos = 0;
  let retrasados = 0;
  let entregados = 0;

  for (const p of partes) {
    if (p.estado_reparacion === "Entregado") {
      entregados++;
    } else {
      activos++;
    }
    if (esRetrasado(p)) retrasados++;
  }

  return { total: partes.length, activos, retrasados, entregados };
}

// Formatea una fecha ISO a formato español dd/mm/aaaa
export function formatFecha(fechaISO: string): string {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

// Fecha de hoy en formato ISO (YYYY-MM-DD)
export function hoyISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().split("T")[0];
}
