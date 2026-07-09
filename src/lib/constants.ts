// ============================================================
// Constantes de dominio — Partes de Taller Suproval
// ============================================================

export const TIPOS_MAQUINA = [
  "Tractor",
  "Manipulador telescópico",
  "Miniexcavadora",
  "Compresor",
  "Dumper",
  "Carretilla",
  "Otro",
] as const;

// Los 7 estados de reparación en orden lógico de flujo
export const ESTADOS_REPARACION = [
  "Pte. llegada a taller",
  "Pendiente de reparar",
  "Parado/Sin piezas",
  "En reparación",
  "Gestionando garantía",
  "Reparado. Pte. entrega",
  "Entregado",
] as const;

export type EstadoReparacion = (typeof ESTADOS_REPARACION)[number];

// Estados que se consideran "finales" (parte cerrado / entregado)
export const ESTADOS_FINALES: EstadoReparacion[] = [
  "Reparado. Pte. entrega",
  "Entregado",
];

// Un parte se considera "retrasado" si lleva más de estos días
// sin alcanzar un estado final.
export const DIAS_RETRASO = 5;

export const DELEGACIONES = ["Suproval Cheste", "Suproval Aldaia"] as const;

export type Delegacion = (typeof DELEGACIONES)[number];

// Intervalos de 30 min desde "30 min" hasta "10h"
export const TIEMPOS_TRABAJO: string[] = (() => {
  const opciones: string[] = [];
  for (let mins = 30; mins <= 600; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) {
      opciones.push(`${m} min`);
    } else if (m === 0) {
      opciones.push(`${h}h`);
    } else {
      opciones.push(`${h}h ${m}min`);
    }
  }
  return opciones;
})();

export const ROLES = ["admin", "mecanico"] as const;
export type Rol = (typeof ROLES)[number];

// ------------------------------------------------------------
// Presentación de estados (colores de badge)
// ------------------------------------------------------------
export type BadgeTone = "red" | "orange" | "blue" | "green";

export const ESTADO_TONE: Record<EstadoReparacion, BadgeTone> = {
  "Pte. llegada a taller": "red",
  "Pendiente de reparar": "orange",
  "Parado/Sin piezas": "red",
  "En reparación": "blue",
  "Gestionando garantía": "blue",
  "Reparado. Pte. entrega": "green",
  Entregado: "green",
};

export const BADGE_CLASSES: Record<BadgeTone, string> = {
  red: "bg-red-100 text-red-800 border border-red-200",
  orange: "bg-orange-100 text-orange-800 border border-orange-200",
  blue: "bg-blue-100 text-blue-800 border border-blue-200",
  green: "bg-green-100 text-green-800 border border-green-200",
};

// Colores hex para los gráficos (por estado)
export const ESTADO_COLOR_HEX: Record<EstadoReparacion, string> = {
  "Pte. llegada a taller": "#DC2626",
  "Pendiente de reparar": "#EA580C",
  "Parado/Sin piezas": "#B91C1C",
  "En reparación": "#2563EB",
  "Gestionando garantía": "#0891B2",
  "Reparado. Pte. entrega": "#16A34A",
  Entregado: "#15803D",
};

export const DELEGACION_COLOR_HEX: Record<string, string> = {
  "Suproval Cheste": "#0D1B4B",
  "Suproval Aldaia": "#F5C800",
};
