-- ============================================================
-- SUPROVAL — Migración: rastreo del estado "Parado/Sin piezas"
-- Pégalo tal cual en el SQL Editor de Supabase y ejecútalo.
--
-- Añade la columna parado_desde, que registra desde cuándo un
-- parte está en el estado 'Parado/Sin piezas'. Se mantiene
-- automáticamente mediante trigger:
--   - Al pasar a 'Parado/Sin piezas'  -> parado_desde = now()
--   - Al salir de 'Parado/Sin piezas' -> parado_desde = null
--   - Si sigue en 'Parado/Sin piezas' -> no se toca (así no se
--     reinicia al editar otros campos del parte)
-- ============================================================

-- 1. Columna nueva
alter table public.partes_taller
  add column if not exists parado_desde timestamptz;

-- 2. Función del trigger
-- Solo actúa en las TRANSICIONES de estado; si el parte sigue en
-- 'Parado/Sin piezas' no toca parado_desde (así no se reinicia al
-- editar otros campos y el backfill/correcciones manuales funcionan).
create or replace function public.track_parado_desde()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.estado_reparacion = 'Parado/Sin piezas' then
      new.parado_desde = now();
    else
      new.parado_desde = null;
    end if;
  elsif new.estado_reparacion = 'Parado/Sin piezas'
        and old.estado_reparacion is distinct from 'Parado/Sin piezas' then
    -- Acaba de entrar en el estado
    new.parado_desde = now();
  elsif new.estado_reparacion <> 'Parado/Sin piezas' then
    -- Deja de estar (o no está) en el estado
    new.parado_desde = null;
  end if;
  return new;
end;
$$;

-- 3. Trigger (insert + update)
drop trigger if exists trg_partes_parado_desde on public.partes_taller;
create trigger trg_partes_parado_desde
  before insert or update on public.partes_taller
  for each row
  execute function public.track_parado_desde();

-- 4. Backfill: partes que YA están en 'Parado/Sin piezas'
update public.partes_taller
set parado_desde = coalesce(updated_at, created_at)
where estado_reparacion = 'Parado/Sin piezas'
  and parado_desde is null;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
