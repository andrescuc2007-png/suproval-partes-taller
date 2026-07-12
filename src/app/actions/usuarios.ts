"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ROLES, type Rol } from "@/lib/constants";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// Comprueba que el usuario actual es admin.
async function requireAdmin(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "No autenticado." };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "admin") {
    return { ok: false, error: "Solo un administrador puede hacer esto." };
  }
  return { ok: true };
}

// ------------------------------------------------------------
// Crear usuario (admin)
// ------------------------------------------------------------
export async function crearUsuario(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const nombre = (formData.get("nombre") as string)?.trim() || null;
  const rol = (formData.get("rol") as Rol) || "mecanico";

  if (!email || !password) {
    return { ok: false, error: "Email y contraseña son obligatorios." };
  }
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (!ROLES.includes(rol)) {
    return { ok: false, error: "Rol no válido." };
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (error) return { ok: false, error: error.message };

  // El trigger crea el perfil con rol "mecanico"; ajustamos rol y nombre.
  const { error: perfilError } = await admin
    .from("profiles")
    .update({ rol, nombre })
    .eq("id", data.user.id);

  if (perfilError) return { ok: false, error: perfilError.message };

  revalidatePath("/usuarios");
  return { ok: true };
}

// ------------------------------------------------------------
// Cambiar rol de un usuario (admin)
// ------------------------------------------------------------
export async function cambiarRol(
  userId: string,
  rol: Rol
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  if (!ROLES.includes(rol)) return { ok: false, error: "Rol no válido." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ rol })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/usuarios");
  return { ok: true };
}

// ------------------------------------------------------------
// Eliminar usuario (admin)
// ------------------------------------------------------------
export async function eliminarUsuario(userId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/usuarios");
  return { ok: true };
}
