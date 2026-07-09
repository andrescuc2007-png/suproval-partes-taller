import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Iniciar sesión — Suproval",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="mb-1 text-xl font-bold text-navy">Iniciar sesión</h1>
          <p className="mb-6 text-sm text-slate-500">
            Accede con tu usuario para gestionar los partes de taller.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-300">
          © {new Date().getFullYear()} Suproval — Maquinaria agrícola e industrial
        </p>
      </div>
    </main>
  );
}
