"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DELEGACIONES,
  ESTADOS_REPARACION,
  type Delegacion,
  type EstadoReparacion,
} from "@/lib/constants";
import type { ParteConCreador } from "@/lib/types";
import { calcularResumen, esRetrasado } from "@/lib/partes-utils";
import { exportarExcel, exportarPDF } from "@/lib/export";
import { StatCards } from "./StatCards";
import { Charts } from "./Charts";
import { PartesTable } from "./PartesTable";

interface Props {
  partes: ParteConCreador[];
  esAdmin: boolean;
}

export function DashboardClient({ partes, esAdmin }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoReparacion | "">("");
  const [delegacion, setDelegacion] = useState<Delegacion | "">("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [soloRetrasados, setSoloRetrasados] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return partes.filter((p) => {
      if (q) {
        const enCliente = p.cliente?.toLowerCase().includes(q);
        const enMaquina = p.id_maquina?.toLowerCase().includes(q);
        if (!enCliente && !enMaquina) return false;
      }
      if (estado && p.estado_reparacion !== estado) return false;
      if (delegacion && p.delegacion !== delegacion) return false;
      if (desde && p.fecha < desde) return false;
      if (hasta && p.fecha > hasta) return false;
      if (soloRetrasados && !esRetrasado(p)) return false;
      return true;
    });
  }, [partes, busqueda, estado, delegacion, desde, hasta, soloRetrasados]);

  const resumen = useMemo(() => calcularResumen(filtrados), [filtrados]);
  const totalRetrasados = useMemo(
    () => partes.filter((p) => esRetrasado(p)).length,
    [partes]
  );

  const hayFiltros =
    busqueda || estado || delegacion || desde || hasta || soloRetrasados;

  function limpiar() {
    setBusqueda("");
    setEstado("");
    setDelegacion("");
    setDesde("");
    setHasta("");
    setSoloRetrasados(false);
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Resumen y seguimiento de los partes de taller
          </p>
        </div>
        <Link href="/partes/nuevo" className="btn-gold self-start sm:self-auto">
          + Nuevo parte
        </Link>
      </div>

      {/* Banner de alerta de retrasados */}
      {totalRetrasados > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 text-red-600"
          >
            <path
              d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex-1 text-sm text-red-800">
            <span className="font-semibold">
              {totalRetrasados}{" "}
              {totalRetrasados === 1 ? "parte retrasado" : "partes retrasados"}
            </span>{" "}
            (más de 5 días sin llegar a un estado final).
          </div>
          {!soloRetrasados && (
            <button
              onClick={() => setSoloRetrasados(true)}
              className="btn-danger px-3 py-1.5 text-xs"
            >
              Ver retrasados
            </button>
          )}
        </div>
      )}

      {/* Tarjetas de contadores */}
      <StatCards resumen={resumen} />

      {/* Gráficos */}
      <Charts partes={filtrados} />

      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="label">Buscar (cliente o ID máquina)</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: García o 005588-001"
              className="input"
            />
          </div>
          <div>
            <label className="label">Estado</label>
            <select
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value as EstadoReparacion | "")
              }
              className="input"
            >
              <option value="">Todos</option>
              {ESTADOS_REPARACION.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Delegación</label>
            <select
              value={delegacion}
              onChange={(e) =>
                setDelegacion(e.target.value as Delegacion | "")
              }
              className="input"
            >
              <option value="">Todas</option>
              {DELEGACIONES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={soloRetrasados}
                onChange={(e) => setSoloRetrasados(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy"
              />
              Solo retrasados
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hayFiltros && (
              <button onClick={limpiar} className="btn-outline text-xs">
                Limpiar filtros
              </button>
            )}
            <span className="text-xs text-slate-500">
              {filtrados.length} de {partes.length} partes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportarExcel(filtrados)}
              className="btn-outline text-xs"
              disabled={filtrados.length === 0}
            >
              Exportar Excel
            </button>
            <button
              onClick={() => exportarPDF(filtrados)}
              className="btn-outline text-xs"
              disabled={filtrados.length === 0}
            >
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <PartesTable partes={filtrados} esAdmin={esAdmin} />
    </div>
  );
}
