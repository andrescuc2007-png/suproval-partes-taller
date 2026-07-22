"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_REPARACION } from "@/lib/constants";
import type { EstadoReparacion } from "@/lib/constants";
import type { ParteTaller } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

// Normaliza y valida los datos del formulario.
function parsearFormulario(formData: FormData) {
  const cliente = (formData.get("cliente") as string)?.trim();
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const estado = formData.get("estado_reparacion") as EstadoReparacion;

  const errores: string[] = [];

  if (!cliente) errores.push("El cliente es obligatorio.");

  if (telefono) {
    // Formato de teléfono flexible: 9-15 dígitos, admite +, espacios y guiones
    const limpio = telefono.replace(/[\s-]/g, "");
    if (!/^\+?\d{9,15}$/.test(limpio)) {
      errores.push("El teléfono no tiene un formato válido.");
    }
  }

  if (estado && !ESTADOS_REPARACION.includes(estado)) {
    errores.push("Estado de reparación no válido.");
  }

  const datos = {
    fecha: (formData.get("fecha") as string) || null,
    serie: (formData.get("serie") as string)?.trim() || null,
    cliente,
    telefono,
    id_maquina: (formData.get("id_maquina") as string)?.trim() || null,
    tipo_maquina: (formData.get("tipo_maquina") as string)?.trim() || null,
    estado_reparacion: estado || ESTADOS_REPARACION[0],
    delegacion: (formData.get("delegacion") as string) || null,
    descripcion: (formData.get("descripcion") as string)?.trim() || null,
    material_utilizado:
      (formData.get("material_utilizado") as string)?.trim() || null,
    tiempo_trabajo: (formData.get("tiempo_trabajo") as string) || null,
  };

  return { datos, errores };
}

// ------------------------------------------------------------
// Crear parte
// ------------------------------------------------------------
export async function crearParte(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "No autenticado." };

  const { datos, errores } = parsearFormulario(formData);
  if (errores.length) return { ok: false, error: errores.join(" ") };

  const { data, error } = await supabase
    .from("partes_taller")
    .insert({ ...datos, created_by: user.id })
    .select()
    .single();

  if (error) {
    console.error("[partes] Error al crear el parte:", error);
    return {
      ok: false,
      error: "No se pudo guardar el parte. Inténtalo de nuevo en unos segundos.",
    };
  }

  revalidatePath("/dashboard");
  return { ok: true, id: (data as ParteTaller).id };
}

// ------------------------------------------------------------
// Actualizar parte
// ------------------------------------------------------------
export async function actualizarParte(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "No autenticado." };

  const { datos, errores } = parsearFormulario(formData);
  if (errores.length) return { ok: false, error: errores.join(" ") };

  const { error } = await supabase
    .from("partes_taller")
    .update(datos)
    .eq("id", id);

  if (error) {
    console.error("[partes] Error al actualizar el parte:", error);
    return {
      ok: false,
      error:
        "No se pudieron guardar los cambios. Inténtalo de nuevo en unos segundos.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/partes/${id}`);
  return { ok: true, id };
}

// ------------------------------------------------------------
// Cambio rápido de estado desde la tabla
// ------------------------------------------------------------
export async function cambiarEstado(
  id: string,
  nuevoEstado: EstadoReparacion
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "No autenticado." };

  if (!ESTADOS_REPARACION.includes(nuevoEstado)) {
    return { ok: false, error: "Estado no válido." };
  }

  const { error } = await supabase
    .from("partes_taller")
    .update({ estado_reparacion: nuevoEstado })
    .eq("id", id);

  if (error) {
    console.error("[partes] Error al cambiar el estado:", error);
    return {
      ok: false,
      error: "No se pudo cambiar el estado. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/dashboard");
  return { ok: true, id };
}

// ------------------------------------------------------------
// Eliminar parte (solo admin, reforzado por RLS)
// ------------------------------------------------------------
export async function eliminarParte(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase.from("partes_taller").delete().eq("id", id);

  if (error) {
    console.error("[partes] Error al eliminar el parte:", error);
    return {
      ok: false,
      error:
        "No se pudo eliminar el parte. Solo un administrador puede eliminar partes.",
    };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
