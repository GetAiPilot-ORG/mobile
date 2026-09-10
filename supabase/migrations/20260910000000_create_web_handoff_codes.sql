create table if not exists public.web_handoff_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  user_id uuid not null,
  email text not null,
  organization_id text,
  target_tool text not null,
  client_id text not null,
  redirect_path text not null default '/',
  template_id text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists web_handoff_codes_active_idx
  on public.web_handoff_codes (code_hash, expires_at)
  where consumed_at is null;

alter table public.web_handoff_codes enable row level security;
revoke all on public.web_handoff_codes from anon, authenticated;

create or replace function public.consume_web_handoff_code(input_code_hash text)
returns table (
  user_id uuid,
  email text,
  organization_id text,
  target_tool text,
  client_id text,
  redirect_path text,
  template_id text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.web_handoff_codes
  set consumed_at = now()
  where code_hash = input_code_hash
    and consumed_at is null
    and expires_at > now()
  returning
    web_handoff_codes.user_id,
    web_handoff_codes.email,
    web_handoff_codes.organization_id,
    web_handoff_codes.target_tool,
    web_handoff_codes.client_id,
    web_handoff_codes.redirect_path,
    web_handoff_codes.template_id;
end;
$$;

revoke all on function public.consume_web_handoff_code(text)
  from public, anon, authenticated;