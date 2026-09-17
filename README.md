# ILLENIUM 2026

Production-minded V1 for participant identity, registration, secure verification and festival check-ins.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app requires a Supabase project for authenticated registration, storage, verification and check-ins. Public event pages render a small read-only fallback when Supabase is not configured; no database mutation is faked.

## Routes

- `/` public festival home
- `/events` live event discovery
- `/register` multi-step participant registration (submit after logging in)
- `/auth/login` Supabase Email/Password login
- `/participant/dashboard` participant status and events
- `/participant/id` server-rendered digital ID with QR
- `/oc/dashboard` OC operations home
- `/oc/scanner` camera scanner and manual ID fallback
- `/admin/dashboard` operational metrics
- `/admin/verification` approval queue and ID/QR issuance

## Security notes

QRs contain only an opaque token URL. Verification and check-in run on the server. The service-role key is never imported into client components. Duplicate check-ins are prevented by partial unique indexes and a transaction-safe Postgres function.

For a complete handoff, start with [SETUP.md](SETUP.md) and [docs/HANDOFF.md](docs/HANDOFF.md). Do not use production participant data until the Supabase smoke-test checklist passes.
