create table if not exists public.card_shares (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  image_url text not null,
  label text not null,
  time_period text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists card_shares_slug_idx on public.card_shares(slug);

alter table public.card_shares enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where policyname = 'Allow anonymous inserts on card_shares'
  ) then
    create policy "Allow anonymous inserts on card_shares"
      on public.card_shares
      for insert
      with check (true);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where policyname = 'Allow anonymous select on card_shares'
  ) then
    create policy "Allow anonymous select on card_shares"
      on public.card_shares
      for select
      using (true);
  end if;
end$$;