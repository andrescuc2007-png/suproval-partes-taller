import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Cron diario (Vercel Cron): busca partes que llevan 10 o más días
// en 'Parado/Sin piezas' y, si hay alguno, envía UN ÚNICO aviso a Make.
//
// La service_role key solo funciona en el runtime de Node.js.
export const runtime = "nodejs";
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

  // "paso" indica en qué punto se produjo un fallo inesperado, para que
  // el JSON de error del catch global lo identifique en los logs de Vercel.
  let paso = "inicio";

  try {
    // --- 1. Cliente de Supabase (service_role, solo servidor) ---
    // El cron no tiene sesión de usuario y la tabla tiene RLS.
    paso = "crear_cliente_supabase";
    const supabase = createAdminClient();

    // --- 2. Consulta de partes parados 10+ días ---
    paso = "consulta_supabase";
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
        {
          ok: false,
          paso,
          error: `${error.message}${error.code ? ` (código ${error.code})` : ""}${
            error.hint ? ` — ${error.hint}` : ""
          }`,
        },
        { status: 500 }
      );
    }

    const partes = (data ?? []) as ParteParado[];

    // --- 3. Sin partes que avisar: no se llama a Make ---
    if (partes.length === 0) {
      return NextResponse.json({ ok: true, encontrados: 0, enviado: false });
    }

    // --- 4. Envío del aviso a Make ---
    paso = "webhook_make";
    const url = process.env.MAKE_WEBHOOK_URL;
    if (!url) {
      console.error(
        "[cron recordatorio-parados] MAKE_WEBHOOK_URL no configurada"
      );
      return NextResponse.json(
        { ok: false, paso, error: "MAKE_WEBHOOK_URL no configurada" },
        { status: 500 }
      );
    }

    const payload = {
      evento: "recordatorio_parados",
      total: partes.length,
      partes: partes.map((p) => ({
        ...p,
        dias_parado: p.parado_desde
          ? Math.floor((ahora - new Date(p.parado_desde).getTime()) / MS_POR_DIA)
          : null,
      })),
    };

    let makeStatus: number;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      makeStatus = res.status;
    } catch (err) {
      // Error de red / timeout hacia Make: se informa sin tirar la función.
      console.error("[cron recordatorio-parados] Error de red con Make:", err);
      return NextResponse.json(
        {
          ok: false,
          paso,
          encontrados: partes.length,
          enviado: false,
          error: `Error de red enviando a Make: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
        { status: 502 }
      );
    }

    if (makeStatus < 200 || makeStatus >= 300) {
      console.error(
        `[cron recordatorio-parados] Make respondió ${makeStatus}`
      );
      return NextResponse.json(
        {
          ok: false,
          paso,
          encontrados: partes.length,
          enviado: false,
          make_status: makeStatus,
          error: `Make respondió ${makeStatus}`,
        },
        { status: 502 }
      );
    }

    // --- 5. Éxito ---
    return NextResponse.json({
      ok: true,
      encontrados: partes.length,
      enviado: true,
      make_status: makeStatus,
    });
  } catch (err) {
    // Catch global: cualquier excepción no prevista devuelve SIEMPRE un
    // JSON con el paso en el que ocurrió, nunca un 500 sin cuerpo.
    console.error(`[cron recordatorio-parados] Fallo en paso "${paso}":`, err);
    return NextResponse.json(
      {
        ok: false,
        paso,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
