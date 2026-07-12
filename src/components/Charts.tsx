"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  DELEGACIONES,
  DELEGACION_COLOR_HEX,
  ESTADOS_REPARACION,
  ESTADO_COLOR_HEX,
} from "@/lib/constants";
import type { ParteTaller } from "@/lib/types";

export function Charts({ partes }: { partes: ParteTaller[] }) {
  // Partes por estado
  const porEstado = ESTADOS_REPARACION.map((estado) => ({
    estado,
    // Etiqueta corta para el eje
    corto: estado.length > 14 ? estado.slice(0, 13) + "…" : estado,
    total: partes.filter((p) => p.estado_reparacion === estado).length,
    color: ESTADO_COLOR_HEX[estado],
  }));

  // Partes por delegación
  const porDelegacion = DELEGACIONES.map((deleg) => ({
    name: deleg,
    value: partes.filter((p) => p.delegacion === deleg).length,
    color: DELEGACION_COLOR_HEX[deleg],
  })).filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="card p-4">
        <h3 className="mb-4 text-sm font-semibold text-navy">
          Partes por estado
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={porEstado}
            margin={{ top: 5, right: 10, left: -20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="corto"
              angle={-35}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 10 }}
              height={60}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v) => [`${v} partes`, "Total"]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.estado ?? ""
              }
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {porEstado.map((entry) => (
                <Cell key={entry.estado} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-4">
        <h3 className="mb-4 text-sm font-semibold text-navy">
          Partes por delegación
        </h3>
        {porDelegacion.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
            Sin datos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={porDelegacion}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {porDelegacion.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} partes`, "Total"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
