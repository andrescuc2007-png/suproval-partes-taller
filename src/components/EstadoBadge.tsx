import { BADGE_CLASSES, ESTADO_TONE } from "@/lib/constants";
import type { EstadoReparacion } from "@/lib/constants";

export function EstadoBadge({ estado }: { estado: EstadoReparacion }) {
  const tone = ESTADO_TONE[estado] ?? "blue";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASSES[tone]}`}
    >
      {estado}
    </span>
  );
}

export function RetrasadoBadge() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-red-300 bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 8v5M12 16h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Retrasado
    </span>
  );
}
