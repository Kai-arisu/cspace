-- The owner sets the day's agenda; their team sees it and ticks items off.
-- Applied to the project as migration "team_agenda". Owners use the table directly (RLS: own rows);
-- team members read it through my_team() and tick items through my_agenda_tick().
create table if not exists public.team_agenda (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  text text not null check (char_length(text) between 1 and 200),
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists team_agenda_owner_day on public.team_agenda (owner_id, day);
alter table public.team_agenda enable row level security;
create policy "owner reads agenda" on public.team_agenda for select to authenticated using (owner_id = (select auth.uid()));
create policy "owner adds agenda" on public.team_agenda for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owner edits agenda" on public.team_agenda for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner clears agenda" on public.team_agenda for delete to authenticated using (owner_id = (select auth.uid()));
-- my_agenda_tick(p_id, p_done) and the 'agenda' field of my_team() are defined in the applied migration.
