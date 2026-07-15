"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS_REPARACION, type EstadoReparacion } from "@/lib/constants";
import type { ParteConCreador } from "@/lib/types";
import { esRetrasado, formatFecha, diasDesde } from "@/lib/partes-utils";
import { cambiarEstado, eliminarParte } from "@/app/actions/partes";
import { EstadoBadge, RetrasadoBadge } from "./EstadoBadge";

interface Props {
  partes: ParteConCreador[];
  esAdmin: boolean;
}

function EstadoSelector({
  parte,
}: {
  parte: ParteConCreador;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState<EstadoReparacion>(parte.estado_reparacion);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevo = e.target.value as EstadoReparacion;
    setValor(nuevo);
    startTransition(async () => {
      const res = await cambiarEstado(parte.id, nuevo);
      if (res.ok) {
        router.refresh();
      } else {
        setValor(parte.estado_reparacion); // revertir
        alert(res.error ?? "No se pudo cambiar el estado.");
      }
    });
  }

  return (
    <select
      value={valor}
      onChange={onChange}
      disabled={isPending}
      className="input max-w-[190px] py-1 text-xs"
      title="Cambiar estado"
    >
      {ESTADOS_REPARACION.map((e) => (
        <option key={e} value={e}>
          {e}
        </option>
      ))}
    </select>
  );
}

export function PartesTable({ partes, esAdmin }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function borrar(id: string) {
    if (!confirm("¿Eliminar este parte? Esta acción no se puede deshacer."))
      return;
    startTransition(async () => {
      const res = await eliminarParte(id);
      if (res.ok) router.refresh();
      else alert(res.error ?? "No se pudo eliminar.");
    });
  }

  if (partes.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-slate-400">
        No hay partes que coincidan con los filtros.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Vista de tabla (escritorio) */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3 font-semibold">Fecha</th>
              <th className="px-3 py-3 font-semibold">Cliente</th>
              <th className="px-3 py-3 font-semibold">ID Máquina</th>
              <th className="px-3 py-3 font-semibold">Tipo</th>
              <th className="px-3 py-3 font-semibold">Delegación</th>
              <th className="px-3 py-3 font-semibold">Estado</th>
              <th className="px-3 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {partes.map((p) => {
              const retrasado = esRetrasado(p);
              return (
                <tr
                  key={p.id}
                  className={retrasado ? "bg-red-50/50" : "hover:bg-slate-50"}
                >
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{formatFecha(p.fecha)}</div>
                    {(p.creador?.nombre || p.creador?.email) && (
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        por {p.creador.nombre || p.creador.email}
                      </div>
                    )}
                    {retrasado && (
                      <div className="mt-1 text-[10px] font-semibold text-red-600">
                        {diasDesde(p.fecha)} días
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-navy">{p.cliente}</div>
                    {p.telefono && (
                      <div className="text-xs text-slate-400">{p.telefono}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                    {p.id_maquina ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {p.tipo_maquina ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {p.delegacion ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1.5">
                      {retrasado && <RetrasadoBadge />}
                      <EstadoSelector parte={p} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/partes/${p.id}`}
                        className="btn-outline px-2.5 py-1 text-xs"
                      >
                        Editar
                      </Link>
                      {esAdmin && (
                        <button
                          onClick={() => borrar(p.id)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas (móvil) */}
      <div className="divide-y divide-slate-100 lg:hidden">
        {partes.map((p) => {
          const retrasado = esRetrasado(p);
          return (
            <div key={p.id} className={retrasado ? "bg-red-50/50 p-4" : "p-4"}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-navy">{p.cliente}</div>
                  <div className="text-xs text-slate-500">
                    {formatFecha(p.fecha)} · {p.id_maquina ?? "sin ID"}
                  </div>
                </div>
                {retrasado && <RetrasadoBadge />}
              </div>

              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                {p.tipo_maquina && <span>{p.tipo_maquina}</span>}
                {p.delegacion && <span>{p.delegacion}</span>}
                {p.telefono && <span>{p.telefono}</span>}
                {(p.creador?.nombre || p.creador?.email) && (
                  <span>por {p.creador.nombre || p.creador.email}</span>
                )}
              </div>

              <div className="mb-3">
                <EstadoBadge estado={p.estado_reparacion} />
              </div>

              <div className="flex items-center gap-2">
                <EstadoSelector parte={p} />
                <Link
                  href={`/partes/${p.id}`}
                  className="btn-outline px-3 py-1 text-xs"
                >
                  Editar
                </Link>
                {esAdmin && (
                  <button
                    onClick={() => borrar(p.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
