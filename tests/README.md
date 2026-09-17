# V1 test coverage

Run the deterministic token test with `npm test`. The database-sensitive acceptance flow should be run against a disposable Supabase project after applying the migration: submit participant → approve participant → render digital ID → verify opaque QR → check in → repeat scan and assert duplicate rejection. The database function and partial unique indexes are the source of truth for concurrent duplicate prevention.
