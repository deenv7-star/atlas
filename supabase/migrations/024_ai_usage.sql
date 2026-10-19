-- 024_ai_usage: per-user daily cap for the ai-chat edge function ("שאלו את atlas").
-- OPTIONAL and NOT APPLIED by this PR. ai-chat v4 works without it (minute limit only); once applied,
-- every question calls ai_usage_bump() and gets "daily_limit" after p_daily_limit questions a day.
-- Additive only: one new table + one function. Rollback: drop function ai_usage_bump(int); drop table ai_usage;

create table if not exists public.ai_usage (
  user_id   uuid not null references auth.users(id) on delete cascade,
  day       date not null default (now() at time zone 'Asia/Jerusalem')::date,
  questions integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- people may read their own counter (e.g. "נשארו X שאלות היום" later); nobody writes directly
drop policy if exists ai_usage_select_own on public.ai_usage;
create policy ai_usage_select_own on public.ai_usage for select using (user_id = auth.uid());

-- Atomically count one question for the calling user; true while under the limit.
create or replace function public.ai_usage_bump(p_daily_limit integer default 150)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_day date := (now() at time zone 'Asia/Jerusalem')::date;
  v_n integer;
begin
  if v_uid is null then
    return false;
  end if;
  insert into public.ai_usage as u (user_id, day, questions, updated_at)
  values (v_uid, v_day, 1, now())
  on conflict (user_id, day) do update
    set questions = u.questions + 1, updated_at = now()
  returning questions into v_n;
  return v_n <= greatest(1, coalesce(p_daily_limit, 150));
end;
$$;

revoke all on function public.ai_usage_bump(integer) from public;
grant execute on function public.ai_usage_bump(integer) to authenticated;

-- old rows are not needed after a month
create index if not exists ai_usage_day_idx on public.ai_usage (day);
