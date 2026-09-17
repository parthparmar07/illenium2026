-- Run after creating the staff accounts in Supabase Authentication.
-- Change the email addresses below to the accounts that were created in the dashboard.
-- This script is idempotent and does not create passwords or expose credentials.

insert into public.profiles (user_id, full_name, email, role)
select id, 'ILLENIUM Admin', email, 'admin'::public.user_role
from auth.users where email = 'admin@example.com'
on conflict (user_id) do update set role='admin'::public.user_role, full_name=excluded.full_name;

insert into public.profiles (user_id, full_name, email, role)
select id, 'ILLENIUM OC 01', email, 'oc'::public.user_role
from auth.users where email = 'oc01@example.com'
on conflict (user_id) do update set role='oc'::public.user_role, full_name=excluded.full_name;

insert into public.profiles (user_id, full_name, email, role)
select id, 'ILLENIUM Executive Core', email, 'executive_core'::public.user_role
from auth.users where email = 'executive@example.com'
on conflict (user_id) do update set role='executive_core'::public.user_role, full_name=excluded.full_name;

-- Assign an OC to an event after copying the real IDs from the tables:
-- insert into public.oc_event_assignments (oc_profile_id, event_id)
-- select p.id, e.id from public.profiles p, public.events e
-- where p.email='oc01@example.com' and e.slug='street-play';
