-- Bring your own AI: a person makes an access token, pastes it into Claude, ChatGPT or Gemini
-- (any assistant that speaks MCP), and the assistant can read their workspace and add to it.
-- Tokens are stored only as SHA-256 hashes. Anything the assistant adds lands in ai_inbox and
-- the app imports it, so the assistant never writes into the synced workspace behind the app's back.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.ai_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.ai_tokens enable row level security;
create policy "own tokens: read" on public.ai_tokens for select to authenticated using (user_id = (select auth.uid()));
create policy "own tokens: revoke" on public.ai_tokens for delete to authenticated using (user_id = (select auth.uid()));
-- no insert/update policy: tokens are made only by create_ai_token below

create table if not exists public.ai_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('idea','task','note')),
  payload jsonb not null,
  source text,
  created_at timestamptz not null default now(),
  imported_at timestamptz
);
create index if not exists ai_inbox_pending on public.ai_inbox (user_id) where imported_at is null;
alter table public.ai_inbox enable row level security;
create policy "own inbox: read" on public.ai_inbox for select to authenticated using (user_id = (select auth.uid()));
create policy "own inbox: mark imported" on public.ai_inbox for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own inbox: clear" on public.ai_inbox for delete to authenticated using (user_id = (select auth.uid()));
-- the assistant's writes come from the mcp edge function (service role), never from the browser

-- Makes a token and returns it once. Only its hash is kept.
create or replace function public.create_ai_token(p_name text)
returns text language plpgsql security definer set search_path = '' as $$
declare t text; n int;
begin
  if (select auth.uid()) is null then raise exception 'sign in first'; end if;
  select count(*) into n from public.ai_tokens where user_id = (select auth.uid());
  if n >= 10 then raise exception 'ten tokens is the limit; revoke one first'; end if;
  t := 'csk_' || encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.ai_tokens (user_id, name, token_hash)
    values ((select auth.uid()), left(coalesce(nullif(trim(p_name), ''), 'My assistant'), 60),
            encode(extensions.digest(t, 'sha256'), 'hex'));
  return t;
end $$;
revoke all on function public.create_ai_token(text) from public, anon;
grant execute on function public.create_ai_token(text) to authenticated;
