import type { ParteTaller } from "./types";

type EventoWebhook = "creado" | "actualizado";

// Envía el parte al webhook de Make. El fallo NUNCA debe bloquear
// el guardado del parte: capturamos y registramos cualquier error.
export async function enviarWebhookMake(
  parte: ParteTaller,
  evento: EventoWebhook
): Promise<void> {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) {
    console.warn("[webhook] MAKE_WEBHOOK_URL no configurada; se omite el envío");
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento, ...parte }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(
        `[webhook] Make respondió ${res.status} ${res.statusText}`
      );
    }
  } catch (err) {
    // No relanzamos: el guardado del parte no debe verse afectado.
    console.error("[webhook] Error enviando a Make:", err);
  }
}
