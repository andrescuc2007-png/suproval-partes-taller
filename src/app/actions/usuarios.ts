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
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function crearUsuario(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const nombre = (formData.get("nombre") as string)?.trim() || null;
  const rol = (formData.get("rol") as Rol) || "mecanico";

  if (!email || !password) {
    return { ok: false, error: "Email y contraseña son obligatorios." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: "El email no tiene un formato válido." };
  }
  if (password.length < 8) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }
  if (!ROLES.includes(rol)) {
    return { ok: false, error: "Rol no válido." };
  }

  const admin = createAdminClient();

  // ¿Existe ya un usuario con ese email?
  const { data: existente, error: existeError } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existeError) {
    console.error(
      "[usuarios] Error comprobando si el email ya existe:",
      existeError
    );
    return {
      ok: false,
      error: `No se pudo comprobar si el email ya existe: ${existeError.message}`,
    };
  }
  if (existente) {
    return { ok: false, error: `Ya existe un usuario con el email ${email}.` };
  }

  // (a) Crear el usuario en auth.users, ya confirmado.
  // Pasamos nombre y rol en la metadata para que, si el trigger
  // handle_new_user existe, cree el perfil ya con el rol correcto.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  });

  if (error) {
    console.error("[usuarios] Error creando usuario en Auth:", error);
    if (/already|exists|registered/i.test(error.message)) {
      return {
        ok: false,
        error: `Ya existe un usuario con el email ${email}.`,
      };
    }
    if (/password/i.test(error.message)) {
      return {
        ok: false,
        error: `La contraseña no cumple los requisitos de seguridad (${error.message}).`,
      };
    }
    return { ok: false, error: `No se pudo crear el usuario: ${error.message}` };
  }

  // (b) Asegurar la fila en public.profiles con el rol elegido.
  // El upsert cubre tanto si el trigger ya creó la fila como si no.
  const { error: perfilError } = await admin
    .from("profiles")
    .upsert({ id: data.user.id, email, nombre, rol }, { onConflict: "id" });

  if (perfilError) {
    console.error("[usuarios] Error guardando el perfil:", perfilError);
    // Deshacer el alta en Auth para no dejar un usuario sin perfil
    const { error: deleteError } = await admin.auth.admin.deleteUser(
      data.user.id
    );
    if (deleteError) {
      console.error(
        "[usuarios] No se pudo deshacer el alta en Auth:",
        deleteError
      );
    }
    return {
      ok: false,
      error: `El usuario no se pudo crear porque falló el guardado de su perfil: ${perfilError.message}`,
    };
  }

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

  if (error) {
    console.error("[usuarios] Error cambiando el rol:", error);
    return { ok: false, error: `No se pudo cambiar el rol: ${error.message}` };
  }

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

  if (error) {
    console.error("[usuarios] Error eliminando usuario:", error);
    return {
      ok: false,
      error: `No se pudo eliminar el usuario: ${error.message}`,
    };
  }

  revalidatePath("/usuarios");
  return { ok: true };
}
