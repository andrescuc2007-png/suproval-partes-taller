"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ROLES, type Rol } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { formatFecha } from "@/lib/partes-utils";
import {
  crearUsuario,
  cambiarRol,
  eliminarUsuario,
} from "@/app/actions/usuarios";

interface Props {
  usuarios: Profile[];
  currentUserId: string;
}

const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  mecanico: "Mecánico",
};

export function UsuariosClient({ usuarios, currentUserId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const res = await crearUsuario(formData);
      if (res.ok) {
        setOk("Usuario creado correctamente.");
        form.reset();
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo crear el usuario.");
      }
    });
  }

  function onCambiarRol(userId: string, rol: Rol) {
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await cambiarRol(userId, rol);
      if (res.ok) router.refresh();
      else setError(res.error ?? "No se pudo cambiar el rol.");
    });
  }

  function borrar(userId: string) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer."))
      return;
    setError(null);
    setOk(null);
    startTransition(async () => {
      const res = await eliminarUsuario(userId);
      if (res.ok) router.refresh();
      else setError(res.error ?? "No se pudo eliminar el usuario.");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Usuarios</h1>
        <p className="text-sm text-slate-500">
          Gestiona los usuarios que acceden al sistema.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {ok}
        </div>
      )}

      {/* Crear usuario */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-navy">
          Crear nuevo usuario
        </h2>
        <form
          onSubmit={crear}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="label">Nombre</label>
            <input name="nombre" type="text" className="input" />
          </div>
          <div>
            <label className="label">
              Email <span className="text-red-500">*</span>
            </label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="input"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="label">Rol</label>
            <select name="rol" defaultValue="mecanico" className="input">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROL_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
            >
              {isPending ? "Creando…" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de usuarios */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Alta</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => {
                const esActual = u.id === currentUserId;
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-navy">
                      {u.nombre || "—"}
                      {esActual && (
                        <span className="ml-2 text-[10px] uppercase text-gold-700">
                          (tú)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.rol}
                        disabled={esActual || isPending}
                        onChange={(e) =>
                          onCambiarRol(u.id, e.target.value as Rol)
                        }
                        className="input max-w-[140px] py-1 text-xs disabled:opacity-60"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROL_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatFecha(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {!esActual && (
                        <button
                          onClick={() => borrar(u.id)}
                          disabled={isPending}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
