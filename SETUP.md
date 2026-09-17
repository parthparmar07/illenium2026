# Supabase setup

1. Create a Supabase project and enable Email/Password Auth.
2. Copy the project URL and anon key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Add the service-role key as `SUPABASE_SERVICE_ROLE_KEY`; it is server-only.
4. Run `supabase/migrations/202609170001_init.sql` in the SQL editor.
5. Run `supabase/seed.sql` for three development colleges and three events.
6. Create Auth users for staff, then create matching `profiles` rows with `role` set to `oc`, `admin`, or `executive_core`. Assign OCs in `oc_event_assignments`.
7. Storage buckets are created by the migration. Keep them private. Add Storage policies scoped to the owner profile before enabling uploads in production.
8. Set `NEXT_PUBLIC_APP_URL` to the deployed origin. For real OCR, set `OCR_PROVIDER=http`, `OCR_API_URL`, and `OCR_API_KEY`; otherwise the app exposes an explicit demo adapter that produces no extracted identity data.
9. Deploy to Vercel with the same environment variables and run `npm run build` before deployment.

The current V1 intentionally leaves offline scan queues, certificate generation, payments and external notifications as extension points. It does not claim to support offline check-ins.
