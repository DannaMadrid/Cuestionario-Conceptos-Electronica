create table public.resultados (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  puntaje numeric(4,2) not null check (puntaje between 0 and 10),
  puntaje_max numeric(4,2) not null default 10,
  porcentaje numeric(5,2) not null,
  correctas int not null,
  incorrectas int not null,
  respuestas jsonb not null,
  estado text not null default 'completado',
  finalizado_en timestamptz not null default now()
);
create index on public.resultados (user_id);
alter table public.resultados enable row level security;

-- Sin políticas de INSERT/UPDATE/DELETE: solo la función del servidor (service_role) escribe.
revoke all on public.resultados from anon, authenticated;
grant select on public.resultados to authenticated;

create policy "estudiante ve lo suyo" on public.resultados for select to authenticated
  using (user_id = auth.uid());
create policy "admin ve todo" on public.resultados for select to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- Tras crear el usuario admin en Authentication > Users:
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"role":"admin"}' where email = 'TU_CORREO';
