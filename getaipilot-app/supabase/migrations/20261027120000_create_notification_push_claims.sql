-- Apply before deploying the BFF that uses this table.
-- All BFF realtime subscribers compete for the same unique notification row.
create table if not exists public.notification_push_claims (
  notification_id text primary key,
  claimed_at timestamptz not null default now()
);

alter table public.notification_push_claims enable row level security;
revoke all on public.notification_push_claims from anon, authenticated;
grant select, insert on public.notification_push_claims to service_role;

comment on table public.notification_push_claims is
  'At-most-once push dispatch claims shared by all BFF instances. Do not delete claims while notifications can be replayed.';
