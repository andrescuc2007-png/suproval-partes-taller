import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UsuariosClient } from "@/components/UsuariosClient";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Usuarios — Suproval" };

export default async function UsuariosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user!.id)
    .single();

  // Solo admin
  if (perfil?.rol !== "admin") redirect("/dashboard");

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, email, nombre, rol, created_at")
    .order("created_at", { ascending: true });

  return (
    <UsuariosClient
      usuarios={(usuarios as Profile[]) ?? []}
      currentUserId={user!.id}
    />
  );
}
