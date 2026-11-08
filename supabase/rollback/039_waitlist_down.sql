-- Rollback for 039_waitlist.sql. Drops the waitlist table WITH its rows: export them first
-- (select * from public.waitlist_signups) if any real signups exist. contact_messages rows stay.
drop trigger if exists trg_contact_messages_waitlist_push on public.contact_messages;
drop function if exists public.trg_push_waitlist_signup();
drop function if exists public.waitlist_stats();
drop function if exists public.join_waitlist(text, text, text, text, text, text, boolean);
drop table if exists public.waitlist_signups;
