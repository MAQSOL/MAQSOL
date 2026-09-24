-- ============================================================
-- MAQSISTEM · Esquema compartido (adaptado a la tabla real "perfiles")
-- Ejecutar UNA VEZ en Supabase → SQL Editor → pegar todo → Run
-- ============================================================

-- ---------- 0) Limpiar tablas vacías de la otra sesión (se recrean abajo) ----------
drop table if exists public.cotizaciones_ventas cascade;
drop table if exists public.cotizaciones_rentas cascade;
drop table if exists public.cotizaciones_refacciones cascade;
drop table if exists public.asistencias cascade;
drop table if exists public.colaboradores cascade;
drop table if exists public.clientes cascade;

-- ---------- 1) Perfiles: columnas extra, admin y permisos ----------
alter table public.perfiles
  add column if not exists apodo text,
  add column if not exists foto_url text,
  add column if not exists color_acento text default 'azul';

create or replace function public.es_admin()
returns boolean as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$ language sql security definer stable;

alter table public.perfiles enable row level security;

drop policy if exists "perfiles_select_all_auth" on public.perfiles;
create policy "perfiles_select_all_auth" on public.perfiles
  for select using (auth.uid() is not null);

drop policy if exists "perfiles_update_self" on public.perfiles;
create policy "perfiles_update_self" on public.perfiles
  for update using (id = auth.uid());

-- nadie (salvo admin) puede cambiarse el rol ni el código de folio
create or replace function public.evitar_autoescalada_rol()
returns trigger as $$
begin
  if not public.es_admin() then
    new.rol := old.rol;
    new.codigo_folio := old.codigo_folio;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_evitar_autoescalada_rol on public.perfiles;
create trigger trg_evitar_autoescalada_rol
  before update on public.perfiles
  for each row execute procedure public.evitar_autoescalada_rol();

-- ---------- 2) Tablas compartidas: todos ven, solo admin escribe ----------
-- Cada registro va como JSON en "data": agregar campos nuevos NO requiere tocar la base.
create table if not exists public.equipos_internos (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists public.equipos_externos (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists public.fletes           (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists public.checklists       (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists public.colaboradores    (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists public.asistencias      (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists public.clientes         (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists public.pendientes       (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());

create table if not exists public.catalogos (
  tipo text not null,
  valor text not null,
  primary key (tipo, valor)
);

create table if not exists public.configuracion (
  clave text primary key,
  valor text not null
);
insert into public.configuracion (clave, valor)
  values ('nip_clientes', '102018')
  on conflict (clave) do nothing;

do $$
declare t text;
begin
  foreach t in array array['equipos_internos','equipos_externos','fletes','checklists','colaboradores','asistencias','clientes','catalogos','configuracion','pendientes']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s_select_all" on public.%1$s', t);
    execute format('create policy "%1$s_select_all" on public.%1$s for select using (auth.uid() is not null)', t);
  end loop;

  -- cualquier usuario logueado puede registrar, editar y borrar en lo compartido
  foreach t in array array['equipos_internos','equipos_externos','fletes','checklists','colaboradores','asistencias','clientes','catalogos','pendientes']
  loop
    execute format('drop policy if exists "%1$s_write_admin" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_write_auth" on public.%1$s', t);
    execute format('create policy "%1$s_write_auth" on public.%1$s for all using (auth.uid() is not null) with check (auth.uid() is not null)', t);
  end loop;
end $$;

-- el NIP (configuracion) solo lo cambia un admin
drop policy if exists "configuracion_write_admin" on public.configuracion;
create policy "configuracion_write_admin" on public.configuracion for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists "pendientes_insert_all" on public.pendientes;
drop policy if exists "pendientes_update_all" on public.pendientes;
drop policy if exists "pendientes_delete_admin" on public.pendientes;

-- ---------- 3) Cotizaciones: cada quien ve y edita las suyas; admin todas ----------
create table if not exists public.cotizaciones (
  id text primary key,
  tipo text not null check (tipo in ('venta','renta','refaccion')),
  data jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_by_email text,
  updated_at timestamptz default now()
);
alter table public.cotizaciones enable row level security;

drop policy if exists "cotizaciones_select_own_or_admin" on public.cotizaciones;
create policy "cotizaciones_select_own_or_admin" on public.cotizaciones
  for select using (created_by = auth.uid() or public.es_admin());
drop policy if exists "cotizaciones_insert_own" on public.cotizaciones;
create policy "cotizaciones_insert_own" on public.cotizaciones
  for insert with check (created_by = auth.uid());
drop policy if exists "cotizaciones_update_own_or_admin" on public.cotizaciones;
create policy "cotizaciones_update_own_or_admin" on public.cotizaciones
  for update using (created_by = auth.uid() or public.es_admin());
drop policy if exists "cotizaciones_delete_own_or_admin" on public.cotizaciones;
create policy "cotizaciones_delete_own_or_admin" on public.cotizaciones
  for delete using (created_by = auth.uid() or public.es_admin());

-- ---------- 4) Lista de precios, reporte de horas y contratos ----------
create table if not exists public.lista_precios (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists public.horas_maquina (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
create table if not exists public.contratos     (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());

insert into public.configuracion (clave, valor) values ('nip_precios', '102018') on conflict (clave) do nothing;

do $$
declare t text;
begin
  foreach t in array array['lista_precios','horas_maquina','contratos']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s_all_auth" on public.%1$s', t);
    execute format('create policy "%1$s_all_auth" on public.%1$s for all using (auth.uid() is not null) with check (auth.uid() is not null)', t);
  end loop;
end $$;

-- ---------- 5) Alquileres activos (equipos en renta) + almacenamiento de fotos y checklist PDF ----------
create table if not exists public.alquileres (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
alter table public.alquileres enable row level security;
drop policy if exists "alquileres_all_auth" on public.alquileres;
create policy "alquileres_all_auth" on public.alquileres for all using (auth.uid() is not null) with check (auth.uid() is not null);

insert into storage.buckets (id, name, public, file_size_limit)
values ('alquileres', 'alquileres', false, 15728640)
on conflict (id) do nothing;

drop policy if exists "alquileres_storage_select" on storage.objects;
create policy "alquileres_storage_select" on storage.objects for select using (bucket_id = 'alquileres' and auth.uid() is not null);
drop policy if exists "alquileres_storage_insert" on storage.objects;
create policy "alquileres_storage_insert" on storage.objects for insert with check (bucket_id = 'alquileres' and auth.uid() is not null);
drop policy if exists "alquileres_storage_update" on storage.objects;
create policy "alquileres_storage_update" on storage.objects for update using (bucket_id = 'alquileres' and auth.uid() is not null);
drop policy if exists "alquileres_storage_delete" on storage.objects;
create policy "alquileres_storage_delete" on storage.objects for delete using (bucket_id = 'alquileres' and auth.uid() is not null);

-- ---------- 6) Cargas de diesel ----------
create table if not exists public.diesel_cargas (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
alter table public.diesel_cargas enable row level security;
drop policy if exists "diesel_cargas_all_auth" on public.diesel_cargas;
create policy "diesel_cargas_all_auth" on public.diesel_cargas for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------- 7) Documentos de personal (SOLO ADMIN: son datos confidenciales) ----------
create table if not exists public.personal (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
alter table public.personal enable row level security;
drop policy if exists "personal_admin_all" on public.personal;
create policy "personal_admin_all" on public.personal for all using (public.es_admin()) with check (public.es_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('personal', 'personal', false, 15728640)
on conflict (id) do nothing;

drop policy if exists "personal_storage_admin_select" on storage.objects;
create policy "personal_storage_admin_select" on storage.objects for select using (bucket_id = 'personal' and public.es_admin());
drop policy if exists "personal_storage_admin_insert" on storage.objects;
create policy "personal_storage_admin_insert" on storage.objects for insert with check (bucket_id = 'personal' and public.es_admin());
drop policy if exists "personal_storage_admin_update" on storage.objects;
create policy "personal_storage_admin_update" on storage.objects for update using (bucket_id = 'personal' and public.es_admin());
drop policy if exists "personal_storage_admin_delete" on storage.objects;
create policy "personal_storage_admin_delete" on storage.objects for delete using (bucket_id = 'personal' and public.es_admin());
