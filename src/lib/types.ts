import type { Delegacion, EstadoReparacion, Rol } from "./constants";

export interface ParteTaller {
  id: string;
  fecha: string; // ISO date (YYYY-MM-DD)
  serie: string | null;
  cliente: string;
  telefono: string | null;
  id_maquina: string | null;
  tipo_maquina: string | null;
  estado_reparacion: EstadoReparacion;
  delegacion: Delegacion | null;
  descripcion: string | null;
  material_utilizado: string | null;
  tiempo_trabajo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Payload para crear/actualizar (sin campos gestionados por el servidor)
export type ParteInput = Omit<
  ParteTaller,
  "id" | "created_by" | "created_at" | "updated_at"
>;

export interface Profile {
  id: string;
  email: string;
  nombre: string | null;
  rol: Rol;
  created_at: string;
}

// Parte con datos del creador (join opcional)
export interface ParteConCreador extends ParteTaller {
  creador?: { nombre: string | null; email: string } | null;
}
