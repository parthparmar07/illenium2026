-- ========================================================
-- ILLENIUM 2026 — ALL-IN-ONE SUPABASE DATABASE SETUP SCRIPT
-- Copy and run this ENTIRE script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kcrbkgzfupkczqycnqnw/sql/new
-- ========================================================

-- 1. Extensions & Types
create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('participant','oc','admin','executive_core');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum ('pending','verified','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.registration_status as enum ('draft','submitted','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_status as enum ('draft','open','closed','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.contingency_status as enum ('open','locked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.check_in_type as enum ('campus_entry','event_entry');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('on_time','late');
exception when duplicate_object then null; end $$;

-- 2. Create Tables
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  photo_url text,
  role public.user_role not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  code text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contingencies (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id),
  name text not null,
  leader_profile_id uuid references public.profiles(id),
  assistant_leader_profile_id uuid references public.profiles(id),
  status public.contingency_status not null default 'open',
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  illenium_id text unique,
  college_id uuid not null references public.colleges(id),
  contingency_id uuid references public.contingencies(id),
  college_roll_number text not null,
  verification_status public.verification_status not null default 'pending',
  registration_status public.registration_status not null default 'draft',
  college_id_file_path text,
  government_id_file_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  category text not null,
  venue text not null,
  capacity integer check (capacity is null or capacity > 0),
  reporting_time timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  status text not null default 'registered' check(status in ('registered','cancelled','waitlisted')),
  registered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(participant_id,event_id)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  college_id uuid not null references public.colleges(id),
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(team_id,participant_id)
);

create table if not exists public.oc_event_assignments (
  id uuid primary key default gen_random_uuid(),
  oc_profile_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(oc_profile_id,event_id)
);

create table if not exists public.qr_tokens (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid unique not null references public.participants(id) on delete cascade,
  token_hash text unique not null,
  token_ciphertext text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id),
  event_id uuid references public.events(id),
  check_in_type public.check_in_type not null,
  scanned_by uuid not null references public.profiles(id),
  scanned_at timestamptz not null default now(),
  attendance_status public.attendance_status,
  status text not null default 'accepted',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.verification_records (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  reviewed_by uuid references public.profiles(id),
  decision text not null,
  extracted_data jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Functions
create or replace function public.current_role() returns public.user_role language sql stable security definer set search_path=public as $$
  select role from public.profiles where user_id=auth.uid() limit 1
$$;

create or replace function public.next_illenium_id() returns text language plpgsql security definer set search_path=public as $$
declare
  next_number integer;
begin
  perform pg_advisory_xact_lock(26062026);
  select coalesce(max(substring(illenium_id from 7)::integer),0)+1 into next_number from public.participants where illenium_id like 'ILL-26-%';
  return 'ILL-26-' || lpad(next_number::text,6,'0');
end;
$$;

create or replace function public.record_check_in(p_participant_id uuid, p_event_id uuid, p_check_in_type public.check_in_type, p_scanned_by uuid) returns public.check_ins language plpgsql security definer set search_path=public as $$
declare
  row public.check_ins;
  event_reporting timestamptz;
begin
  if public.current_role() not in ('oc','admin','executive_core') then
    raise exception 'not authorized';
  end if;
  if p_check_in_type='event_entry' then
    select reporting_time into event_reporting from public.events where id=p_event_id;
    if not exists(select 1 from public.oc_event_assignments where oc_profile_id=p_scanned_by and event_id=p_event_id) and public.current_role()='oc' then
      raise exception 'event not assigned';
    end if;
  end if;
  insert into public.check_ins(participant_id,event_id,check_in_type,scanned_by,attendance_status)
  values(p_participant_id,p_event_id,p_check_in_type,p_scanned_by,case when event_reporting is not null and now()>event_reporting then 'late' else 'on_time' end)
  returning * into row;
  
  insert into public.audit_logs(actor_profile_id,action,entity_type,entity_id,new_value)
  values(p_scanned_by,'check_in.created','check_in',row.id,jsonb_build_object('participant_id',p_participant_id,'event_id',p_event_id));
  
  return row;
exception when unique_violation then
  raise exception 'duplicate check-in';
end;
$$;

-- 4. GRANT Privileges to PostgREST roles (CRITICAL FOR SUPABASE ACCESS)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all routines in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to postgres, anon, authenticated, service_role;

-- 5. RLS Policies
alter table public.profiles enable row level security;
alter table public.colleges enable row level security;
alter table public.contingencies enable row level security;
alter table public.participants enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.oc_event_assignments enable row level security;
alter table public.qr_tokens enable row level security;
alter table public.check_ins enable row level security;
alter table public.audit_logs enable row level security;
alter table public.verification_records enable row level security;
alter table public.notifications enable row level security;

-- Drop existing policies if re-running
drop policy if exists "public can read open events" on public.events;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "participants read own participant" on public.participants;
drop policy if exists "participants create own record" on public.participants;
drop policy if exists "participants read own registrations" on public.event_registrations;
drop policy if exists "participants create own registrations" on public.event_registrations;
drop policy if exists "ocs read assigned events" on public.oc_event_assignments;
drop policy if exists "ocs read safe participants" on public.participants;
drop policy if exists "ocs read checkins" on public.check_ins;
drop policy if exists "admins read audit" on public.audit_logs;
drop policy if exists "allow service role all on profiles" on public.profiles;
drop policy if exists "allow service role all on participants" on public.participants;
drop policy if exists "allow service role all on colleges" on public.colleges;
drop policy if exists "allow service role all on events" on public.events;

-- Create Permissive & Staff Policies
create policy "public can read open events" on public.events for select using(true);
create policy "public can read colleges" on public.colleges for select using(true);
create policy "users read profiles" on public.profiles for select using(true);
create policy "users update own profile" on public.profiles for update using(user_id=auth.uid());
create policy "users insert own profile" on public.profiles for insert with check(true);

create policy "read participants" on public.participants for select using(true);
create policy "insert participants" on public.participants for insert with check(true);
create policy "update participants" on public.participants for update using(true);

create policy "read registrations" on public.event_registrations for select using(true);
create policy "insert registrations" on public.event_registrations for insert with check(true);

create policy "read qr tokens" on public.qr_tokens for select using(true);
create policy "insert qr tokens" on public.qr_tokens for insert with check(true);
create policy "update qr tokens" on public.qr_tokens for update using(true);

create policy "read checkins" on public.check_ins for select using(true);
create policy "insert checkins" on public.check_ins for insert with check(true);

-- 6. Storage Buckets
insert into storage.buckets(id,name,public) values ('participant-photos','participant-photos',false),('college-ids','college-ids',false),('government-ids','government-ids',false) on conflict(id) do nothing;

-- 7. Seed Default Colleges & Events
insert into public.colleges(name,short_name,code) values 
('Atlas SkillTech University','Atlas','ATLAS'),
('Raman Institute of Technology','RIT','RIT'),
('Western Arts College','WAC','WAC')
on conflict(code) do nothing;

insert into public.events(name,slug,description,category,venue,capacity,reporting_time,start_time,end_time,status) values 
('Battle of Bands','battle-of-bands','Live band showdown.','Music','Main Arena',80,now()+interval '2 days',now()+interval '2 days 2 hours',now()+interval '2 days 5 hours','open'),
('Street Play','street-play','Stories in motion.','Theatre','Open Air Court',90,now()+interval '3 days',now()+interval '3 days 2 hours',now()+interval '3 days 4 hours','open'),
('Frame / Freeze','frame-freeze','Visual arts competition.','Visual Arts','The Gallery',50,now()+interval '4 days',now()+interval '4 days 1 hour',now()+interval '4 days 3 hours','open')
on conflict(slug) do nothing;

-- 8. Bootstrap Admin & OC User Profiles
insert into public.profiles (user_id, full_name, email, role)
select id, 'ILLENIUM Admin', email, 'admin'::public.user_role
from auth.users where email = 'admin@example.com'
on conflict (user_id) do update set role='admin'::public.user_role, full_name=excluded.full_name;

insert into public.profiles (user_id, full_name, email, role)
select id, 'ILLENIUM OC 01', email, 'oc'::public.user_role
from auth.users where email = 'oc01@example.com'
on conflict (user_id) do update set role='oc'::public.user_role, full_name=excluded.full_name;

-- Link existing auth users to profiles as participants
insert into public.profiles (user_id, full_name, email, role)
select id, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email, 'participant'::public.user_role
from auth.users where email not in ('admin@example.com', 'oc01@example.com')
on conflict (user_id) do nothing;
