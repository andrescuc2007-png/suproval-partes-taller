"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DELEGACIONES,
  ESTADOS_REPARACION,
  TIEMPOS_TRABAJO,
  TIPOS_MAQUINA,
} from "@/lib/constants";
import type { ParteTaller } from "@/lib/types";
import { hoyISO } from "@/lib/partes-utils";
import { crearParte, actualizarParte } from "@/app/actions/partes";

interface Props {
  parte?: ParteTaller; // si viene, es edición
}

export function ParteForm({ parte }: Props) {
  const router = useRouter();
  const esEdicion = Boolean(parte);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Tipo de máquina: soporta valor libre además de las opciones
  const tipoInicial = parte?.tipo_maquina ?? "";
  const tipoEsPredefinido =
    tipoInicial === "" || TIPOS_MAQUINA.includes(tipoInicial as never);
  const [tipoSelect, setTipoSelect] = useState(
    tipoEsPredefinido ? tipoInicial : "Otro"
  );
  const [tipoLibre, setTipoLibre] = useState(
    tipoEsPredefinido ? "" : tipoInicial
  );

  // Validación de teléfono en cliente
  const [telefonoError, setTelefonoError] = useState<string | null>(null);
  function validarTelefono(valor: string) {
    if (!valor.trim()) {
      setTelefonoError(null);
      return;
    }
    const limpio = valor.replace(/[\s-]/g, "");
    setTelefonoError(
      /^\+?\d{9,15}$/.test(limpio)
        ? null
        : "Formato no válido (9-15 dígitos)."
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    // Resolver tipo_maquina (libre vs predefinido)
    const tipoFinal =
      tipoSelect === "Otro" && tipoLibre.trim()
        ? tipoLibre.trim()
        : tipoSelect;
    formData.set("tipo_maquina", tipoFinal);

    startTransition(async () => {
      const res = esEdicion
        ? await actualizarParte(parte!.id, formData)
        : await crearParte(formData);

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo guardar el parte.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Fecha */}
        <div>
          <label htmlFor="fecha" className="label">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={parte?.fecha ?? hoyISO()}
            className="input"
          />
        </div>

        {/* Serie */}
        <div>
          <label htmlFor="serie" className="label">
            Serie
          </label>
          <input
            id="serie"
            name="serie"
            type="text"
            defaultValue={parte?.serie ?? ""}
            className="input"
            placeholder="Nº de serie"
          />
        </div>

        {/* Cliente (obligatorio) */}
        <div>
          <label htmlFor="cliente" className="label">
            Cliente <span className="text-red-500">*</span>
          </label>
          <input
            id="cliente"
            name="cliente"
            type="text"
            required
            defaultValue={parte?.cliente ?? ""}
            className="input"
            placeholder="Nombre del cliente"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="telefono" className="label">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="tel"
            defaultValue={parte?.telefono ?? ""}
            onChange={(e) => validarTelefono(e.target.value)}
            className="input"
            placeholder="+34 600 000 000"
          />
          {telefonoError && (
            <p className="mt-1 text-xs text-red-600">{telefonoError}</p>
          )}
        </div>

        {/* ID Máquina */}
        <div>
          <label htmlFor="id_maquina" className="label">
            ID Máquina <span className="text-red-500">*</span>
          </label>
          <input
            id="id_maquina"
            name="id_maquina"
            type="text"
            required
            defaultValue={parte?.id_maquina ?? ""}
            className="input"
            placeholder="Ej: 005588-001"
          />
        </div>

        {/* Horómetro */}
        <div>
          <label htmlFor="horometro" className="label">
            Horómetro (horas de máquina){" "}
            <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            id="horometro"
            name="horometro"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            defaultValue={parte?.horometro ?? ""}
            className="input"
            placeholder="Ej: 3450"
          />
        </div>

        {/* Tipo de máquina (desplegable + libre) */}
        <div>
          <label htmlFor="tipo_select" className="label">
            Tipo de máquina
          </label>
          <select
            id="tipo_select"
            value={tipoSelect}
            onChange={(e) => setTipoSelect(e.target.value)}
            className="input"
          >
            <option value="">Selecciona…</option>
            {TIPOS_MAQUINA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {tipoSelect === "Otro" && (
            <input
              type="text"
              value={tipoLibre}
              onChange={(e) => setTipoLibre(e.target.value)}
              className="input mt-2"
              placeholder="Escribe el tipo de máquina"
            />
          )}
        </div>

        {/* Estado de reparación */}
        <div>
          <label htmlFor="estado_reparacion" className="label">
            Estado de reparación
          </label>
          <select
            id="estado_reparacion"
            name="estado_reparacion"
            defaultValue={parte?.estado_reparacion ?? ESTADOS_REPARACION[0]}
            className="input"
          >
            {ESTADOS_REPARACION.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        {/* Delegación */}
        <div>
          <label htmlFor="delegacion" className="label">
            Delegación
          </label>
          <select
            id="delegacion"
            name="delegacion"
            defaultValue={parte?.delegacion ?? ""}
            className="input"
          >
            <option value="">Selecciona…</option>
            {DELEGACIONES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Tiempo de trabajo */}
        <div>
          <label htmlFor="tiempo_trabajo" className="label">
            Tiempo de trabajo
          </label>
          <select
            id="tiempo_trabajo"
            name="tiempo_trabajo"
            defaultValue={parte?.tiempo_trabajo ?? ""}
            className="input"
          >
            <option value="">Sin especificar</option>
            {TIEMPOS_TRABAJO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="descripcion" className="label">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          defaultValue={parte?.descripcion ?? ""}
          className="input"
          placeholder="Descripción de la avería / trabajo a realizar"
        />
      </div>

      {/* Material utilizado */}
      <div>
        <label htmlFor="material_utilizado" className="label">
          Material utilizado <span className="text-slate-400">(opcional)</span>
        </label>
        <textarea
          id="material_utilizado"
          name="material_utilizado"
          rows={3}
          defaultValue={parte?.material_utilizado ?? ""}
          className="input"
          placeholder="Piezas y materiales empleados"
        />
      </div>

      {/* Acciones */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="btn-outline"
          disabled={isPending}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isPending || Boolean(telefonoError)}
        >
          {isPending
            ? "Guardando…"
            : esEdicion
              ? "Guardar cambios"
              : "Crear parte"}
        </button>
      </div>
    </form>
  );
}
