-- Every Claude call the wayword edge function makes is logged here, and the limits are checked
-- against it. Only the function (service role) touches this table: RLS is on with no policies,
-- and clients have no grants. Cards, photos and practice never leave the phone.

create table public.wayword_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  ip_hash text,
  mode text not null check (mode in ('snap', 'explain', 'talk', 'story')),
  model text not null,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create index wayword_requests_user_recent on public.wayword_requests (user_id, created_at desc);
create index wayword_requests_ip_recent on public.wayword_requests (ip_hash, created_at desc);
create index wayword_requests_recent on public.wayword_requests (created_at desc);

alter table public.wayword_requests enable row level security;
revoke all on public.wayword_requests from anon, authenticated;

-- Every limit is checked and the request recorded in one locked step, so a burst of parallel
-- requests cannot all see the same count and all pass. Token totals are capped as well, so one
-- user cannot send only the most expensive calls.
create function public.claim_wayword_request(
  p_user uuid,
  p_ip_hash text,
  p_mode text,
  p_model text,
  p_user_per_minute integer,
  p_user_per_day integer,
  p_ip_per_day integer,
  p_project_per_day integer,
  p_user_tokens_per_day bigint,
  p_project_tokens_per_day bigint
)
returns table (request_id bigint, refusal text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('wayword.claim_wayword_request'));

  if (select count(*) from public.wayword_requests
      where user_id = p_user and created_at > now() - interval '1 minute') >= p_user_per_minute then
    return query select null::bigint, 'user_minute'::text;
    return;
  end if;

  if (select count(*) from public.wayword_requests
      where user_id = p_user and created_at > now() - interval '1 day') >= p_user_per_day then
    return query select null::bigint, 'user_day'::text;
    return;
  end if;

  if p_ip_hash is not null and (select count(*) from public.wayword_requests
      where ip_hash = p_ip_hash and created_at > now() - interval '1 day') >= p_ip_per_day then
    return query select null::bigint, 'ip_day'::text;
    return;
  end if;

  if (select coalesce(sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)), 0)
      from public.wayword_requests
      where user_id = p_user and created_at > now() - interval '1 day') >= p_user_tokens_per_day then
    return query select null::bigint, 'user_tokens'::text;
    return;
  end if;

  if (select count(*) from public.wayword_requests
      where created_at > now() - interval '1 day') >= p_project_per_day
     or (select coalesce(sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)), 0)
         from public.wayword_requests
         where created_at > now() - interval '1 day') >= p_project_tokens_per_day then
    return query select null::bigint, 'project_day'::text;
    return;
  end if;

  insert into public.wayword_requests (user_id, ip_hash, mode, model)
  values (p_user, p_ip_hash, p_mode, p_model)
  returning id into new_id;

  return query select new_id, null::text;
end;
$$;

revoke execute on function public.claim_wayword_request from public, anon, authenticated;
grant execute on function public.claim_wayword_request to service_role;
