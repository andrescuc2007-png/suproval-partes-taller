import Link from "next/link";
import { ParteForm } from "@/components/ParteForm";

export const metadata = { title: "Nuevo parte — Suproval" };

export default function NuevoPartePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-navy"
        >
          ← Volver al dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">Nuevo parte</h1>
        <p className="text-sm text-slate-500">
          Registra un nuevo parte de taller.
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <ParteForm />
      </div>
    </div>
  );
}
