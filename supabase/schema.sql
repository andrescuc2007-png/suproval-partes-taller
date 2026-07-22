-- ============================================================
-- SUPROVAL — Partes de Taller
-- Script de creación de tablas, triggers y políticas RLS.
-- Pégalo tal cual en el SQL Editor de Supabase y ejecútalo.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabla de perfiles (extiende auth.users con rol y nombre)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  nombre      text,
  rol         text not null default 'mecanico'
                check (rol in ('admin', 'mecanico')),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. Tabla principal: partes_taller
-- ------------------------------------------------------------
create table if not exists public.partes_taller (
  id                  uuid primary key default gen_random_uuid(),
  fecha               date not null default current_date,
  serie               text,
  cliente             text not null,
  telefono            text,
  id_maquina          text,
  tipo_maquina        text,
  horometro           numeric
                        check (horometro is null or horometro >= 0),
  estado_reparacion   text not null default 'Pte. llegada a taller'
                        check (estado_reparacion in (
                          'Pte. llegada a taller',
                          'Pendiente de reparar',
                          'Parado/Sin piezas',
                          'En reparación',
                          'Gestionando garantía',
                          'Reparado. Pte. entrega',
                          'Entregado'
                        )),
  delegacion          text
                        check (delegacion is null or delegacion in (
                          'Suproval Cheste',
                          'Suproval Aldaia'
                        )),
  descripcion         text,
  material_utilizado  text,
  tiempo_trabajo      text,
  parado_desde        timestamptz,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Índices útiles para filtros y ordenación
create index if not exists idx_partes_fecha        on public.partes_taller (fecha desc);
create index if not exists idx_partes_estado       on public.partes_taller (estado_reparacion);
create index if not exists idx_partes_delegacion   on public.partes_taller (delegacion);
create index if not exists idx_partes_cliente      on public.partes_taller (cliente);
create index if not exists idx_partes_created_by   on public.partes_taller (created_by);

-- ------------------------------------------------------------
-- 3. Trigger: mantener updated_at al modificar un parte
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_partes_updated_at on public.partes_taller;
create trigger trg_partes_updated_at
  before update on public.partes_taller
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 3b. Trigger: rastrear desde cuándo un parte está en
--     'Parado/Sin piezas' (columna parado_desde)
-- ------------------------------------------------------------
-- Solo actúa en las TRANSICIONES de estado; si el parte sigue en
-- 'Parado/Sin piezas' no toca parado_desde (así no se reinicia al
-- editar otros campos del parte).
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
    new.parado_desde = now();
  elsif new.estado_reparacion <> 'Parado/Sin piezas' then
    new.parado_desde = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_partes_parado_desde on public.partes_taller;
create trigger trg_partes_parado_desde
  before insert or update on public.partes_taller
  for each row
  execute function public.track_parado_desde();

-- ------------------------------------------------------------
-- 4. Trigger: crear perfil automáticamente al registrarse
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'nombre',
    coalesce(new.raw_user_meta_data ->> 'rol', 'mecanico')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 5. Función auxiliar: ¿el usuario actual es admin?
--    (evita recursión en las políticas de profiles)
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.partes_taller  enable row level security;

-- --- Políticas de PROFILES ---
-- Cada usuario ve su propio perfil; los admin ven todos.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Cada usuario puede actualizar su propio nombre; los admin, todo.
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Solo los admin pueden eliminar perfiles.
drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- --- Políticas de PARTES_TALLER ---
-- Cualquier usuario autenticado puede LEER todos los partes.
drop policy if exists "partes_select" on public.partes_taller;
create policy "partes_select" on public.partes_taller
  for select to authenticated
  using (true);

-- Cualquier usuario autenticado puede CREAR partes (a su nombre).
drop policy if exists "partes_insert" on public.partes_taller;
create policy "partes_insert" on public.partes_taller
  for insert to authenticated
  with check (created_by = auth.uid());

-- Cualquier usuario autenticado puede ACTUALIZAR partes.
drop policy if exists "partes_update" on public.partes_taller;
create policy "partes_update" on public.partes_taller
  for update to authenticated
  using (true)
  with check (true);

-- Solo los admin pueden ELIMINAR partes.
drop policy if exists "partes_delete" on public.partes_taller;
create policy "partes_delete" on public.partes_taller
  for delete to authenticated
  using (public.is_admin());

-- ============================================================
-- FIN DEL SCRIPT
-- Recuerda: crea tu primer usuario admin desde Authentication >
-- Users en Supabase, y luego marca su rol con:
--   update public.profiles set rol = 'admin' where email = 'tu@correo.com';
-- ============================================================
