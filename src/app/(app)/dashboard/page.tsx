import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/DashboardClient";
import type { ParteConCreador } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user!.id)
    .single();

  const esAdmin = perfil?.rol === "admin";

  const { data: partes } = await supabase
    .from("partes_taller")
    .select("*, creador:profiles!partes_taller_created_by_fkey(nombre, email)")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <DashboardClient
      partes={(partes as ParteConCreador[]) ?? []}
      esAdmin={esAdmin}
    />
  );
}
