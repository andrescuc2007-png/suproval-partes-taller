"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DELEGACIONES,
  ESTADOS_REPARACION,
  TIEMPOS_TRABAJO,
  TIPOS_MAQUINA,
} from "@/lib/constants";
import type { MaterialLinea, ParteTaller } from "@/lib/types";
import { hoyISO } from "@/lib/partes-utils";
import { crearParte, actualizarParte } from "@/app/actions/partes";

interface Props {
  parte?: ParteTaller; // si viene, es edición
}

export function ParteForm({ parte }: Props) {
  const router = useRouter();
  const esEdicion = Boolean(parte);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
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

  // Material utilizado: líneas repetibles (nombre + cantidad, sin precio)
  const [materialLineas, setMaterialLineas] = useState<MaterialLinea[]>(
    parte?.material_lineas ?? []
  );
  const materialLegado = parte?.material_utilizado?.trim() || null;

  function agregarLineaMaterial() {
    setMaterialLineas((prev) => [...prev, { nombre: "", cantidad: 1 }]);
  }
  function actualizarLineaMaterial(
    index: number,
    campo: "nombre" | "cantidad",
    valor: string
  ) {
    setMaterialLineas((prev) =>
      prev.map((linea, i) =>
        i === index
          ? {
              ...linea,
              [campo]: campo === "cantidad" ? Number(valor) : valor,
            }
          : linea
      )
    );
  }
  function eliminarLineaMaterial(index: number) {
    setMaterialLineas((prev) => prev.filter((_, i) => i !== index));
  }

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
    setOk(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

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
        if (esEdicion) {
          router.push("/dashboard");
          router.refresh();
          return;
        }
        // Alta: confirmar y dejar el formulario listo para el siguiente parte
        form.reset();
        setTipoSelect("");
        setTipoLibre("");
        setMaterialLineas([]);
        setTelefonoError(null);
        setOk("Parte guardado correctamente. Puedes registrar el siguiente.");
        router.refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(res.error ?? "No se pudo guardar el parte.");
        window.scrollTo({ top: 0, behavior: "smooth" });
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
      {ok && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <span>✓ {ok}</span>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="whitespace-nowrap font-semibold text-green-800 underline"
          >
            Ver partes
          </button>
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

      {/* Material utilizado (líneas repetibles: nombre + cantidad) */}
      <div>
        <label className="label">
          Material utilizado <span className="text-slate-400">(opcional)</span>
        </label>

        {materialLegado && (
          <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <p className="mb-1 text-xs font-semibold text-slate-400">
              Material (formato antiguo, solo lectura)
            </p>
            <p className="whitespace-pre-wrap">{materialLegado}</p>
          </div>
        )}

        <div className="space-y-2">
          {materialLineas.map((linea, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                name="material_nombre"
                value={linea.nombre}
                onChange={(e) =>
                  actualizarLineaMaterial(i, "nombre", e.target.value)
                }
                className="input flex-1"
                placeholder="Pieza o material"
              />
              <input
                type="number"
                name="material_cantidad"
                min="0"
                step="1"
                value={linea.cantidad}
                onChange={(e) =>
                  actualizarLineaMaterial(i, "cantidad", e.target.value)
                }
                className="input w-24"
                placeholder="Cant."
              />
              <button
                type="button"
                onClick={() => eliminarLineaMaterial(i)}
                className="btn-outline px-3"
                aria-label="Eliminar línea"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={agregarLineaMaterial}
          className="btn-outline mt-2"
        >
          + Añadir material
        </button>
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
