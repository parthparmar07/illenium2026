# ILLENIUM 2026 handoff setup

This document is for the person taking over the repository. The application is a Next.js 15 App Router project. Supabase is the required external service for authentication, PostgreSQL, private Storage, QR issuance, verification and check-ins.

## 1. Local prerequisites

- Node.js 20.9+ (Node 22 LTS recommended)
- npm 10+
- A Supabase project
- A Vercel account only when deploying

Clone and install:

```bash
git clone https://github.com/swarnimlovesyou/ILLENIUM2026.git
cd ILLENIUM2026
npm install
cp .env.example .env.local
```

Fill `.env.local` with values from Supabase → Project Settings → API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
OCR_PROVIDER=demo
OCR_API_URL=
OCR_API_KEY=
```

Never commit `.env.local` or the service-role key. The service-role key is used only by server-side code and must never be prefixed with `NEXT_PUBLIC_`.

## 2. Create the Supabase database

In Supabase → SQL Editor, run these files in order:

1. `supabase/migrations/202609170001_init.sql`
2. `supabase/migrations/202609170002_handoff_fixes.sql`
3. `supabase/seed.sql`

The migrations create the application tables, enums, indexes, RLS policies, check-in transaction function, private Storage buckets, and Storage policies. The seed creates development colleges and events only; it does not create fake Auth users or participants.

## 3. Configure Supabase Auth

In Supabase → Authentication → Providers, enable Email.

For local development, add `http://localhost:3000/**` to the allowed redirect URLs. For production, add the Vercel URL as well.

Create staff accounts from Authentication → Users. Use temporary development passwords and change them before handing over production access. Then copy `supabase/bootstrap-staff.sql`, replace the example emails, and run it in SQL Editor.

The bootstrap script creates `profiles` rows with the roles `admin`, `oc`, and `executive_core`. It does not create or print passwords.

To assign an OC to an event, use the commented SQL at the end of `supabase/bootstrap-staff.sql` after the event and profile rows exist.

## 4. Participant golden path

1. Create a participant Auth user with Email/Password.
2. Log in at `/auth/login`.
3. Submit `/register` with a real college UUID from `colleges`.
4. Upload a participant photo and college ID. The files go to private Storage paths under the authenticated user ID.
5. Sign in as an admin and open `/admin/verification`.
6. Approve the participant. The server generates an `ILL-26-XXXXXX` ID and an opaque QR token.
7. The participant opens `/participant/id` to display the server-rendered QR.
8. Sign in as the assigned OC and open `/oc/scanner`.
9. Verify the QR or enter the ILLENIUM ID manually, then create the check-in.

## 5. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`. Validate the production bundle with:

```bash
npm run typecheck
npm run build
npm test
```

Camera scanning requires HTTPS or localhost, camera permission, and a supported mobile browser. The scanner is intentionally online-only in V1.

## 6. Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Select the Next.js framework preset.
3. Add the same variables from `.env.local` in Vercel Project Settings → Environment Variables.
4. Add them separately for Preview and Production. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
5. Set `NEXT_PUBLIC_APP_URL` to the production Vercel URL.
6. Deploy.
7. Add the production URL to Supabase Auth redirect URLs.
8. Run the smoke-test checklist below against the deployed URL.

## 7. Smoke-test checklist

- Public home and `/events` load without Supabase credentials in the UI.
- Participant can sign up, log in and submit registration.
- Photo and college ID upload succeeds and files are not publicly readable.
- Admin approval creates exactly one ILLENIUM ID and QR token.
- Digital ID shows the participant’s real data and a scannable QR.
- Invalid QR is rejected server-side.
- Unverified participant cannot check in.
- OC can only check in assigned event participants.
- Campus entry cannot be checked in twice.
- Event entry cannot be checked in twice.
- Second scan returns duplicate status.
- Late status is determined from the event reporting time.
- Service-role key does not appear in client bundles, logs or browser requests.

## 8. External integrations and intentional limitations

OCR is behind `DocumentExtractionProvider`. `OCR_PROVIDER=demo` is an explicit no-op adapter; it does not invent extracted identity data. Set `OCR_PROVIDER=http` only after supplying a real provider endpoint and API key.

V1 does not implement offline queues, payments, WhatsApp notifications, certificates, scoring, or result publishing. Do not describe those as working features until implemented.
