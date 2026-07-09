"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function login(formData: FormData): Promise<LoginResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { ok: false, error: "Introduce email y contraseña." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: "Credenciales incorrectas." };
  }

  return { ok: true };
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
