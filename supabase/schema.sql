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

-- ---------- 8) Código QR de equipos internos ----------
-- Función pública: devuelve SOLO datos seguros (sin costos, operador, notas ni ubicación) de UN equipo,
-- y solo si quien llama conoce el token secreto del QR. Así el cliente no necesita cuenta.
create or replace function public.equipo_publico(p_token text)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'tipo', e.data->>'tipo',
    'marca', e.data->>'marca',
    'modelo', e.data->>'modelo',
    'serie', e.data->>'serie',
    'anio', e.data->>'anio',
    'motor', e.data->>'motor',
    'capacidad', e.data->>'capacidad',
    'alturaMaxima', e.data->>'alturaMaxima',
    'combustible', e.data->>'combustible',
    'horometro', e.data->>'horometro',
    'proximoMantto', e.data->>'proximoMantto',
    'fotoUrl', e.data->>'fotoUrl',
    'mantenimientos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'mid', m->>'mid',
        'fecha', m->>'fecha',
        'tipoMantto', m->>'tipoMantto',
        'horometro', m->>'horometro',
        'descripcion', m->>'descripcion',
        'realizadoPor', m->>'realizadoPor'
      ) order by m->>'fecha' desc)
      from jsonb_array_elements(coalesce(e.data->'mantenimientos', '[]'::jsonb)) m
    ), '[]'::jsonb)
  )
  from public.equipos_internos e
  where p_token is not null
    and length(p_token) >= 16
    and e.data->>'qrToken' = p_token
  limit 1;
$$;

revoke all on function public.equipo_publico(text) from public;
grant execute on function public.equipo_publico(text) to anon, authenticated;

-- ---------- 9) Tareas / Operaciones ----------
create table if not exists public.tareas (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
alter table public.tareas enable row level security;
drop policy if exists "tareas_all_auth" on public.tareas;
create policy "tareas_all_auth" on public.tareas for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------- 10) Checklist: fotos con enlace público, INE privada ----------
-- Fotos: bucket PÚBLICO con rutas aleatorias (token de 24 caracteres). Solo quien tiene el enlace las ve.
insert into storage.buckets (id, name, public, file_size_limit)
values ('checklist-fotos', 'checklist-fotos', true, 10485760)
on conflict (id) do nothing;

-- INE y documentos: bucket PRIVADO, solo usuarios con sesión.
insert into storage.buckets (id, name, public, file_size_limit)
values ('checklist-docs', 'checklist-docs', false, 15728640)
on conflict (id) do nothing;

do $$
declare b text;
begin
  foreach b in array array['checklist-fotos','checklist-docs']
  loop
    execute format('drop policy if exists "%s_select" on storage.objects', b);
    execute format('create policy "%s_select" on storage.objects for select using (bucket_id = %L and auth.uid() is not null)', b, b);
    execute format('drop policy if exists "%s_insert" on storage.objects', b);
    execute format('create policy "%s_insert" on storage.objects for insert with check (bucket_id = %L and auth.uid() is not null)', b, b);
    execute format('drop policy if exists "%s_update" on storage.objects', b);
    execute format('create policy "%s_update" on storage.objects for update using (bucket_id = %L and auth.uid() is not null)', b, b);
    execute format('drop policy if exists "%s_delete" on storage.objects', b);
    execute format('create policy "%s_delete" on storage.objects for delete using (bucket_id = %L and auth.uid() is not null)', b, b);
  end loop;
end $$;

-- Página pública /fotos/<token>: devuelve solo folio, equipo y rutas de fotos (sin cliente, contacto ni costos).
create or replace function public.checklist_fotos_publico(p_token text)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'folio', c.data->>'folio',
    'fecha', c.data->>'fecha',
    'equipo', c.data->>'equipo',
    'marca', c.data->>'marca',
    'modelo', c.data->>'modelo',
    'serie', c.data->>'serie',
    'fotos', coalesce((
      select jsonb_agg(f->>'path')
      from jsonb_array_elements(coalesce(c.data->'fotos', '[]'::jsonb)) f
    ), '[]'::jsonb)
  )
  from public.checklists c
  where p_token is not null
    and length(p_token) >= 16
    and c.data->>'fotosToken' = p_token
  limit 1;
$$;

revoke all on function public.checklist_fotos_publico(text) from public;
grant execute on function public.checklist_fotos_publico(text) to anon, authenticated;

-- ---------- 11) Personal externo (practicantes): asistencia quincenal ----------
-- La asistencia se guarda en public.asistencias con id "2026-Q20" (año-Q#quincena).
create table if not exists public.personal_externo (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
alter table public.personal_externo enable row level security;
drop policy if exists "personal_externo_all_auth" on public.personal_externo;
create policy "personal_externo_all_auth" on public.personal_externo for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------- 12) Órdenes de compra ----------
-- Correr SOLO este bloque (no todo el archivo: el inicio borra tablas con datos).
create table if not exists public.ordenes_compra (id text primary key, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
alter table public.ordenes_compra enable row level security;
drop policy if exists "ordenes_compra_all_auth" on public.ordenes_compra;
create policy "ordenes_compra_all_auth" on public.ordenes_compra for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------- 13) Modo desarrollador (NIP) ----------
-- Correr SOLO los bloques 13 y 14 (no todo el archivo: el inicio borra tablas con datos).
-- Un usuario que no es admin escribe el NIP en Configuración y por 12 horas tiene permisos de admin.
-- El NIP se guarda cifrado en "secretos": nadie lo puede leer, solo la función lo compara.
create extension if not exists pgcrypto with schema extensions;

alter table public.perfiles
  add column if not exists modo_dev_hasta timestamptz,
  add column if not exists puesto text,
  add column if not exists correo text,
  add column if not exists soporte boolean default false;

create table if not exists public.secretos (clave text primary key, valor_hash text not null);
alter table public.secretos enable row level security;   -- sin políticas: nadie la lee directo
insert into public.secretos (clave, valor_hash)
values ('nip_desarrollador', extensions.crypt('102028', extensions.gen_salt('bf')))
on conflict (clave) do update set valor_hash = excluded.valor_hash;

-- 5 NIP equivocados seguidos = 15 minutos sin poder intentar
create table if not exists public.intentos_nip (id uuid primary key, fallos int not null default 0, bloqueado_hasta timestamptz);
alter table public.intentos_nip enable row level security;

-- admin por rol (el único que puede cambiar roles)
create or replace function public.es_admin_real()
returns boolean as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$ language sql security definer stable set search_path = public;

-- admin para permisos: rol admin o modo desarrollador vigente
create or replace function public.es_admin()
returns boolean as $$
  select exists (select 1 from public.perfiles where id = auth.uid()
                 and (rol = 'admin' or (modo_dev_hasta is not null and modo_dev_hasta > now())));
$$ language sql security definer stable set search_path = public;

-- nadie (salvo un admin por rol) se cambia el rol, el folio, el soporte ni el modo desarrollador a mano
create or replace function public.evitar_autoescalada_rol()
returns trigger as $$
begin
  if not public.es_admin_real() then
    new.rol := old.rol;
    new.codigo_folio := old.codigo_folio;
    new.soporte := old.soporte;
    if coalesce(current_setting('maqsistem.modo_dev', true), '') <> '1' then
      new.modo_dev_hasta := old.modo_dev_hasta;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.activar_modo_desarrollador(p_nip text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_hash text;
  v_bloq timestamptz;
  v_hasta timestamptz;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Sin sesión');
  end if;
  select bloqueado_hasta into v_bloq from public.intentos_nip where id = auth.uid();
  if v_bloq is not null and v_bloq > now() then
    return jsonb_build_object('ok', false, 'error', 'Demasiados intentos. Espera unos minutos.');
  end if;
  select valor_hash into v_hash from public.secretos where clave = 'nip_desarrollador';
  if v_hash is null or extensions.crypt(coalesce(p_nip, ''), v_hash) <> v_hash then
    insert into public.intentos_nip (id, fallos, bloqueado_hasta) values (auth.uid(), 1, null)
    on conflict (id) do update set
      fallos = public.intentos_nip.fallos + 1,
      bloqueado_hasta = case when public.intentos_nip.fallos + 1 >= 5 then now() + interval '15 minutes' else null end;
    return jsonb_build_object('ok', false, 'error', 'NIP incorrecto');
  end if;
  delete from public.intentos_nip where id = auth.uid();
  v_hasta := now() + interval '12 hours';
  perform set_config('maqsistem.modo_dev', '1', true);
  update public.perfiles set modo_dev_hasta = v_hasta where id = auth.uid();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Tu usuario no tiene perfil; pide a un admin que lo dé de alta.');
  end if;
  return jsonb_build_object('ok', true, 'hasta', v_hasta);
end;
$$;

create or replace function public.desactivar_modo_desarrollador()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('maqsistem.modo_dev', '1', true);
  update public.perfiles set modo_dev_hasta = null where id = auth.uid();
end;
$$;

revoke all on function public.activar_modo_desarrollador(text) from public, anon;
revoke all on function public.desactivar_modo_desarrollador() from public, anon;
grant execute on function public.activar_modo_desarrollador(text) to authenticated;
grant execute on function public.desactivar_modo_desarrollador() to authenticated;

-- ---------- 14) Chat interno y actividad en vivo ----------
-- Canales: 'general' (todos), 'dm:<uid>:<uid>' (entre dos), 'soporte:<uid>' (esa persona con Soporte).
create table if not exists public.chat_mensajes (
  id uuid primary key default gen_random_uuid(),
  canal text not null,
  autor uuid not null default auth.uid(),
  autor_nombre text,
  subnombre text,
  texto text,
  adjuntos jsonb not null default '[]'::jsonb,
  creado timestamptz not null default now()
);
create index if not exists chat_mensajes_canal_creado on public.chat_mensajes (canal, creado desc);
alter table public.chat_mensajes enable row level security;

create or replace function public.es_soporte()
returns boolean as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and soporte);
$$ language sql security definer stable set search_path = public;

create or replace function public.puede_ver_canal(p_canal text)
returns boolean as $$
  select auth.uid() is not null and (
    p_canal = 'general'
    or (p_canal like 'dm:%' and position(auth.uid()::text in p_canal) > 0)
    or p_canal = 'soporte:' || auth.uid()::text
    or (p_canal like 'soporte:%' and public.es_soporte())
  );
$$ language sql security definer stable set search_path = public;

drop policy if exists "chat_select" on public.chat_mensajes;
create policy "chat_select" on public.chat_mensajes for select using (public.puede_ver_canal(canal));
drop policy if exists "chat_insert" on public.chat_mensajes;
create policy "chat_insert" on public.chat_mensajes for insert with check (autor = auth.uid() and public.puede_ver_canal(canal));
drop policy if exists "chat_delete_propio" on public.chat_mensajes;
create policy "chat_delete_propio" on public.chat_mensajes for delete using (autor = auth.uid());

-- "Francisco agregó la máquina…", "Kevin registró una carga de diésel…"
create table if not exists public.actividad (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null default auth.uid(),
  autor_nombre text,
  tabla text,
  accion text,
  descripcion text not null,
  creado timestamptz not null default now()
);
create index if not exists actividad_creado on public.actividad (creado desc);
alter table public.actividad enable row level security;
drop policy if exists "actividad_select" on public.actividad;
create policy "actividad_select" on public.actividad for select using (auth.uid() is not null);
drop policy if exists "actividad_insert" on public.actividad;
create policy "actividad_insert" on public.actividad for insert with check (autor = auth.uid());

-- en vivo (Realtime)
do $$
begin
  begin alter publication supabase_realtime add table public.chat_mensajes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.actividad; exception when duplicate_object then null; end;
end $$;

-- imágenes y archivos del chat: bucket privado (se ven con enlace firmado temporal)
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-adjuntos', 'chat-adjuntos', false, 10485760)
on conflict (id) do nothing;
drop policy if exists "chat_adjuntos_select" on storage.objects;
create policy "chat_adjuntos_select" on storage.objects for select using (bucket_id = 'chat-adjuntos' and auth.uid() is not null);
drop policy if exists "chat_adjuntos_insert" on storage.objects;
create policy "chat_adjuntos_insert" on storage.objects for insert with check (bucket_id = 'chat-adjuntos' and auth.uid() is not null);

-- Soporte = Alejandro Balam
update public.perfiles set soporte = true where id in (select id from auth.users where email = 'abalam@maqsol.com.mx');
