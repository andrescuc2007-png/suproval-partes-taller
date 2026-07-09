import type { ResumenPartes } from "@/lib/partes-utils";

interface StatCardProps {
  label: string;
  value: number;
  accent: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, accent, icon }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${accent}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-navy">{value}</div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </div>
      </div>
    </div>
  );
}

export function StatCards({ resumen }: { resumen: ResumenPartes }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        label="Total partes"
        value={resumen.total}
        accent="bg-navy text-gold"
        icon={<IconClipboard />}
      />
      <StatCard
        label="Activos"
        value={resumen.activos}
        accent="bg-blue-100 text-blue-700"
        icon={<IconWrench />}
      />
      <StatCard
        label="Retrasados"
        value={resumen.retrasados}
        accent="bg-red-100 text-red-700"
        icon={<IconAlert />}
      />
      <StatCard
        label="Entregados"
        value={resumen.entregados}
        accent="bg-green-100 text-green-700"
        icon={<IconCheck />}
      />
    </div>
  );
}

function IconClipboard() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconWrench() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.3-2.3 2.5-2.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="m5 13 4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
