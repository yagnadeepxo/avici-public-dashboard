-- Drop existing policies if they exist
drop policy if exists "Allow anonymous inserts on card_shares" on public.card_shares;
drop policy if exists "Allow anonymous select on card_shares" on public.card_shares;

-- Create policies that allow anonymous access
create policy "Allow anonymous inserts on card_shares"
  on public.card_shares
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow anonymous select on card_shares"
  on public.card_shares
  for select
  to anon, authenticated
  using (true);

