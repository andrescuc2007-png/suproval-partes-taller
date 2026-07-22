-- ============================================================
-- SUPROVAL — Migración: material utilizado estructurado
-- Pégalo tal cual en el SQL Editor de Supabase y ejecútalo
-- ANTES de desplegar el código que lo usa.
--
-- Añade la columna material_lineas (jsonb) a partes_taller: lista de
-- líneas [{ "nombre": "...", "cantidad": N }, ...], sin precio.
--
-- La columna antigua material_utilizado (texto libre) NO se toca ni
-- se migra: los partes ya guardados conservan su texto tal cual, y el
-- nuevo formato estructurado se aplica solo a los partes creados o
-- editados a partir de ahora.
-- ============================================================

alter table public.partes_taller
  add column if not exists material_lineas jsonb;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
