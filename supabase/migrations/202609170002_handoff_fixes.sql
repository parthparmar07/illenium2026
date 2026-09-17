-- Follow-up migration for a safe handoff install.
-- Run after 202609170001_init.sql.

create or replace function public.next_illenium_id() returns text
language plpgsql security definer set search_path=public as $$
declare next_number integer;
begin
  perform pg_advisory_xact_lock(26062026);
  select coalesce(max(substring(illenium_id from 8)::integer), 0) + 1
    into next_number
    from public.participants
   where illenium_id like 'ILL-26-%';
  return 'ILL-26-' || lpad(next_number::text, 6, '0');
end;
$$;

-- Private Storage policies. Uploaded paths are namespaced as {auth.uid()}/{participant_id}/{file}.
create policy "participant uploads own files" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('participant-photos','college-ids','government-ids')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "participant reads own files" on storage.objects
for select to authenticated
using (
  bucket_id in ('participant-photos','college-ids','government-ids')
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.current_role() in ('admin','executive_core')
  )
);

create policy "participant updates own files" on storage.objects
for update to authenticated
using ((storage.foldername(name))[1] = (select auth.uid()::text) or public.current_role() in ('admin','executive_core'))
with check ((storage.foldername(name))[1] = (select auth.uid()::text) or public.current_role() in ('admin','executive_core'));

create policy "participant deletes own files" on storage.objects
for delete to authenticated
using ((storage.foldername(name))[1] = (select auth.uid()::text) or public.current_role() in ('admin','executive_core'));
