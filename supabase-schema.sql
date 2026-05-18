-- PromptLibrary — Supabase Schema
-- Cole este SQL no SQL Editor do seu projeto Supabase

-- Tabela de perfis (estende auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  user_name text not null default 'User',
  theme text not null default 'system',
  updated_at timestamptz default now()
);

-- Tabela de categorias
create table public.categories (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null,
  created_at timestamptz default now()
);

-- Tabela de prompts (inclui lixeira via deleted_at)
create table public.prompts (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  description text not null default '',
  category_id text,
  tool text not null default '',
  tags text[] not null default '{}',
  notes text not null default '',
  rating integer not null default 0,
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  attachments jsonb not null default '[]',
  created_at bigint not null,
  updated_at bigint not null,
  last_used_at bigint,
  deleted_at bigint  -- nulo = ativo, preenchido = lixeira
);

-- Ativar Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.prompts enable row level security;

-- Policies: cada usuário só acessa seus próprios dados
create policy "perfil proprio" on public.profiles
  for all using (auth.uid() = id);

create policy "categorias proprias" on public.categories
  for all using (auth.uid() = user_id);

create policy "prompts proprios" on public.prompts
  for all using (auth.uid() = user_id);

-- Cria perfil automaticamente ao cadastrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
