-- ============================================
-- tattoosfineline.com — Schema completo
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- para búsqueda full-text

-- ============================================
-- TABLA: users (extiende auth.users de Supabase)
-- ============================================
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  nombre text,
  tipo text not null default 'cliente' check (tipo in ('cliente', 'tatuador', 'admin')),
  avatar text,
  bio text,
  instagram text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.users enable row level security;

create policy "Usuarios pueden ver perfiles" on public.users
  for select using (true);

create policy "Usuario puede editar su propio perfil" on public.users
  for update using (auth.uid() = id);

create policy "Insertar propio perfil al registrarse" on public.users
  for insert with check (auth.uid() = id);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- TABLA: photos
-- ============================================
create table if not exists public.photos (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  title text,
  alt_text text,
  description text,
  tags text[] default '{}',
  motivo text,
  zona text,
  tamaño text check (tamaño in ('pequeño', 'mediano', 'grande', 'extra-grande')),
  confidence numeric(4,3) check (confidence >= 0 and confidence <= 1),
  status text not null default 'pending' check (status in ('published', 'pending', 'review', 'rejected')),
  tatuador_id uuid references public.users(id) on delete set null,
  likes integer not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

-- Índices para búsqueda y filtrado
create index if not exists photos_status_idx on public.photos(status);
create index if not exists photos_motivo_idx on public.photos(motivo);
create index if not exists photos_zona_idx on public.photos(zona);
create index if not exists photos_tamaño_idx on public.photos(tamaño);
create index if not exists photos_tatuador_idx on public.photos(tatuador_id);
create index if not exists photos_tags_idx on public.photos using gin(tags);
create index if not exists photos_created_idx on public.photos(created_at desc);

-- Búsqueda full-text
create index if not exists photos_search_idx on public.photos
  using gin(to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(motivo,'') || ' ' || coalesce(zona,'')));

-- RLS
alter table public.photos enable row level security;

create policy "Fotos publicadas visibles para todos" on public.photos
  for select using (status = 'published');

create policy "Tatuador ve sus propias fotos" on public.photos
  for select using (auth.uid() = tatuador_id);

create policy "Admin ve todas las fotos" on public.photos
  for select using (
    exists (select 1 from public.users where id = auth.uid() and tipo = 'admin')
  );

create policy "Tatuador puede subir fotos" on public.photos
  for insert with check (
    auth.uid() = tatuador_id and
    exists (select 1 from public.users where id = auth.uid() and tipo in ('tatuador', 'admin'))
  );

create policy "Tatuador puede editar sus fotos" on public.photos
  for update using (auth.uid() = tatuador_id);

create policy "Admin puede editar todas las fotos" on public.photos
  for update using (
    exists (select 1 from public.users where id = auth.uid() and tipo = 'admin')
  );

-- ============================================
-- TABLA: carpetas
-- ============================================
create table if not exists public.carpetas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now(),
  unique(user_id, nombre)
);

alter table public.carpetas enable row level security;

create policy "Usuario ve sus carpetas" on public.carpetas
  for select using (auth.uid() = user_id);

create policy "Usuario crea carpetas" on public.carpetas
  for insert with check (auth.uid() = user_id);

create policy "Usuario elimina carpetas" on public.carpetas
  for delete using (auth.uid() = user_id);

-- ============================================
-- TABLA: saves (fotos guardadas)
-- ============================================
create table if not exists public.saves (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  carpeta_id uuid references public.carpetas(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, photo_id)
);

create index if not exists saves_user_idx on public.saves(user_id);
create index if not exists saves_photo_idx on public.saves(photo_id);

alter table public.saves enable row level security;

create policy "Usuario ve sus saves" on public.saves
  for select using (auth.uid() = user_id);

create policy "Usuario guarda fotos" on public.saves
  for insert with check (auth.uid() = user_id);

create policy "Usuario elimina saves" on public.saves
  for delete using (auth.uid() = user_id);

-- ============================================
-- TABLA: likes
-- ============================================
create table if not exists public.likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, photo_id)
);

create index if not exists likes_photo_idx on public.likes(photo_id);

alter table public.likes enable row level security;

create policy "Likes visibles para todos" on public.likes
  for select using (true);

create policy "Usuario da like" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "Usuario quita like" on public.likes
  for delete using (auth.uid() = user_id);

-- Trigger: actualizar contador de likes en photos
create or replace function public.update_likes_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.photos set likes = likes + 1 where id = NEW.photo_id;
  elsif TG_OP = 'DELETE' then
    update public.photos set likes = likes - 1 where id = OLD.photo_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_like_change on public.likes;
create trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.update_likes_count();

-- ============================================
-- STORAGE: bucket para fotos
-- ============================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Fotos públicas visibles" on storage.objects
  for select using (bucket_id = 'photos');

create policy "Tatuadores pueden subir fotos" on storage.objects
  for insert with check (
    bucket_id = 'photos' and
    auth.role() = 'authenticated'
  );

create policy "Tatuadores pueden borrar sus fotos" on storage.objects
  for delete using (
    bucket_id = 'photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
