-- ============================================================
-- SUPROVAL — Migración: campo horómetro
-- Pégalo tal cual en el SQL Editor de Supabase y ejecútalo
-- ANTES de desplegar el código que lo usa.
--
-- Añade la columna horometro (horas de máquina) a partes_taller.
-- Admite NULL: los partes ya existentes no se ven afectados y el
-- campo es opcional en el formulario.
-- ============================================================

alter table public.partes_taller
  add column if not exists horometro numeric
    check (horometro is null or horometro >= 0);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
