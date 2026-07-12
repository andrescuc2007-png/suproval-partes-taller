import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import type { Rol } from "@/lib/constants";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre, rol, email")
    .eq("id", user.id)
    .single();

  const rol: Rol = (perfil?.rol as Rol) ?? "mecanico";
  const nombre = perfil?.nombre ?? "";
  const email = perfil?.email ?? user.email ?? "";

  return (
    <div className="min-h-screen">
      <Header nombre={nombre} email={email} rol={rol} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
