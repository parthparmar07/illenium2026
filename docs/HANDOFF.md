# Technical handoff summary

## System boundary

```text
Browser → Next.js App Router → Supabase Auth / Postgres / Storage
                             ↘ server-only service-role operations
```

The browser uses the anon key and authenticated cookies. Server-only verification and approval code uses `SUPABASE_SERVICE_ROLE_KEY`. No QR contains participant PII; it contains an opaque token URL and is verified by the server.

## Important directories

- `app/` — public, participant, OC, admin and API routes
- `lib/supabase/` — browser, server and service-role clients
- `services/` — QR verification, check-in, storage, OCR and approval logic
- `supabase/migrations/` — complete SQL schema, RLS, Storage policies and check-in RPC
- `supabase/seed.sql` — fake development colleges/events only
- `supabase/bootstrap-staff.sql` — role assignment after Auth users exist
- `SETUP.md` — complete setup and deployment instructions

## Trust boundaries

- Never trust role, participant ID, event ID or check-in status from the client.
- Never expose private Storage URLs for identity documents.
- Never put government ID, college ID, name, email or phone in a QR.
- Treat the service-role key as a production secret.
- Keep Storage buckets private.

## Database source of truth

Duplicate campus/event check-ins are prevented by partial unique indexes and the `record_check_in` Postgres function. ILLENIUM IDs are generated under a transaction advisory lock. Role-sensitive reads and writes are protected by application authorization plus Supabase RLS.

## Before production

Run the complete smoke-test checklist in `SETUP.md` against a disposable Supabase project first. Review the scanner’s assigned-event context, Storage policies, admin role guards, signed image URLs, and realtime counters before using real participant data.
