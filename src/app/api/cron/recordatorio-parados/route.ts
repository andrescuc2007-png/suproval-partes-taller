import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Cron diario (Vercel Cron): busca partes que llevan 10 o más días
// en 'Parado/Sin piezas' y, si hay alguno, envía UN ÚNICO aviso a Make.
export const dynamic = "force-dynamic";

const ESTADO_PARADO = "Parado/Sin piezas";
const DIAS_AVISO = 10;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

interface ParteParado {
  id: string;
  cliente: string;
  id_maquina: string | null;
  tipo_maquina: string | null;
  descripcion: string | null;
  delegacion: string | null;
  fecha: string;
  parado_desde: string;
}

export async function GET(request: Request) {
  // Vercel Cron envía "Authorization: Bearer <CRON_SECRET>"
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Cliente service_role: el cron no tiene sesión de usuario y la
  // tabla tiene RLS que exige usuario autenticado.
  const supabase = createAdminClient();

  const ahora = Date.now();
  const limite = new Date(ahora - DIAS_AVISO * MS_POR_DIA).toISOString();

  const { data, error } = await supabase
    .from("partes_taller")
    .select(
      "id, cliente, id_maquina, tipo_maquina, descripcion, delegacion, fecha, parado_desde"
    )
    .eq("estado_reparacion", ESTADO_PARADO)
    .lte("parado_desde", limite)
    .order("parado_desde", { ascending: true });

  if (error) {
    console.error("[cron recordatorio-parados] Error de Supabase:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const partes = (data ?? []) as ParteParado[];

  if (partes.length === 0) {
    return NextResponse.json({
      ok: true,
      partes_encontrados: 0,
      aviso_enviado: false,
    });
  }

  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) {
    console.error(
      "[cron recordatorio-parados] MAKE_WEBHOOK_URL no configurada"
    );
    return NextResponse.json(
      {
        ok: false,
        partes_encontrados: partes.length,
        aviso_enviado: false,
        error: "MAKE_WEBHOOK_URL no configurada",
      },
      { status: 500 }
    );
  }

  const payload = {
    evento: "recordatorio_parados",
    total: partes.length,
    partes: partes.map((p) => ({
      ...p,
      dias_parado: Math.floor(
        (ahora - new Date(p.parado_desde).getTime()) / MS_POR_DIA
      ),
    })),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(
        `[cron recordatorio-parados] Make respondió ${res.status} ${res.statusText}`
      );
      return NextResponse.json(
        {
          ok: false,
          partes_encontrados: partes.length,
          aviso_enviado: false,
          error: `Make respondió ${res.status}`,
        },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[cron recordatorio-parados] Error enviando a Make:", err);
    return NextResponse.json(
      {
        ok: false,
        partes_encontrados: partes.length,
        aviso_enviado: false,
        error: "Error de red enviando a Make",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    partes_encontrados: partes.length,
    aviso_enviado: true,
  });
}
