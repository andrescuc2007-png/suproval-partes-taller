import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParteForm } from "@/components/ParteForm";
import type { ParteTaller } from "@/lib/types";
import { formatFecha } from "@/lib/partes-utils";

export const dynamic = "force-dynamic";

export default async function EditarPartePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: parte } = await supabase
    .from("partes_taller")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!parte) notFound();

  const p = parte as ParteTaller;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-navy"
        >
          ← Volver al dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">Editar parte</h1>
        <p className="text-sm text-slate-500">
          {p.cliente} · creado el {formatFecha(p.created_at)}
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <ParteForm parte={p} />
      </div>
    </div>
  );
}
