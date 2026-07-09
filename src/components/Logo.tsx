export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${dims} flex items-center justify-center rounded-lg bg-gold font-black text-navy`}
      >
        <span className={text}>S</span>
      </div>
      <div className="leading-tight">
        <div className={`${text} font-bold text-white`}>SUPROVAL</div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-gold">
          Partes de Taller
        </div>
      </div>
    </div>
  );
}
