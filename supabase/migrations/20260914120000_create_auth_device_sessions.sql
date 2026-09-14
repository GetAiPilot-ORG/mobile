-- A single row represents one active app installation signed in as a user.
-- Auth's own sessions live in auth.sessions and are intentionally not exposed
-- through the client API. This table contains only the device metadata needed
-- for the user's in-app "logged-in devices" view.
create table if not exists public.auth_device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null unique,
  installation_id text not null,
  platform text not null,
  device_name text not null,
  device_type text,
  os_version text,
  app_version text,
  signed_in_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  signed_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, installation_id)
);

create index if not exists auth_device_sessions_user_active_idx
  on public.auth_device_sessions (user_id, last_seen_at desc)
  where signed_out_at is null;

alter table public.auth_device_sessions enable row level security;

-- Device-session data is deliberately served by the authenticated BFF. Do not
-- expose it directly to anon/authenticated clients or put a service-role key
-- in the mobile application.
revoke all on table public.auth_device_sessions from anon, authenticated;
