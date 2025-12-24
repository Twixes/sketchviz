-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create a UUIDv7 generation function
-- UUIDv7 embeds a timestamp for natural ordering
create or replace function uuid_generate_v7()
returns uuid
as $$
declare
  unix_ts_ms bytea;
  uuid_bytes bytea;
begin
  unix_ts_ms = substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3);

  -- Generate random bytes for the rest
  uuid_bytes = unix_ts_ms || gen_random_bytes(10);

  -- Set version (7) and variant bits
  uuid_bytes = set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  uuid_bytes = set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);

  return encode(uuid_bytes, 'hex')::uuid;
end
$$
language plpgsql
volatile;

-- Create threads table
create table public.threads (
  id uuid primary key default uuid_generate_v7(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create generations table
create table public.generations (
  id uuid primary key default uuid_generate_v7(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  input_url varchar(2048) not null,
  output_url varchar(2048),
  user_params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for better query performance
create index threads_user_id_idx on public.threads(user_id);
create index threads_created_at_idx on public.threads(created_at desc);
create index generations_thread_id_idx on public.generations(thread_id);
create index generations_created_at_idx on public.generations(created_at desc);

-- Enable Row Level Security
alter table public.threads enable row level security;
alter table public.generations enable row level security;

-- RLS Policies for threads
-- Users can only see their own threads
create policy "Users can view their own threads"
  on public.threads
  for select
  using (auth.uid() = user_id);

-- Users can insert their own threads
create policy "Users can insert their own threads"
  on public.threads
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own threads
create policy "Users can update their own threads"
  on public.threads
  for update
  using (auth.uid() = user_id);

-- Users can delete their own threads
create policy "Users can delete their own threads"
  on public.threads
  for delete
  using (auth.uid() = user_id);

-- RLS Policies for generations
-- Users can only see generations from their own threads
create policy "Users can view generations from their own threads"
  on public.generations
  for select
  using (
    exists (
      select 1 from public.threads
      where threads.id = generations.thread_id
      and threads.user_id = auth.uid()
    )
  );

-- Users can insert generations into their own threads
create policy "Users can insert generations into their own threads"
  on public.generations
  for insert
  with check (
    exists (
      select 1 from public.threads
      where threads.id = generations.thread_id
      and threads.user_id = auth.uid()
    )
  );

-- Users can update generations in their own threads
create policy "Users can update generations in their own threads"
  on public.generations
  for update
  using (
    exists (
      select 1 from public.threads
      where threads.id = generations.thread_id
      and threads.user_id = auth.uid()
    )
  );

-- Users can delete generations from their own threads
create policy "Users can delete generations from their own threads"
  on public.generations
  for delete
  using (
    exists (
      select 1 from public.threads
      where threads.id = generations.thread_id
      and threads.user_id = auth.uid()
    )
  );

-- Create a function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_threads_updated_at
  before update on public.threads
  for each row
  execute function update_updated_at_column();

create trigger update_generations_updated_at
  before update on public.generations
  for each row
  execute function update_updated_at_column();
