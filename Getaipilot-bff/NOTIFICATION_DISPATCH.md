Broadcast duplicate prevention
==============================

The dashboard inserts one notifications row. Every BFF process subscribes to
those inserts, including local development servers pointed at production.
The old in-memory guards protected only a single process. Each subscriber
could send the same row independently.

Deployment order:

1. Apply `../getaipilot-app/supabase/migrations/20261027120000_create_notification_push_claims.sql`
   to the shared Supabase database.
2. Configure the BFF with its service-role key (claims are unavailable to clients).
3. Build and deploy the BFF; stop/replace all older BFF processes, including dev
   processes using the production database. Old versions do not honor claims.
4. Send one test broadcast. Expect one dispatch log for its row ID; other
   subscribers should report that another dispatcher claimed it.

Claims provide at-most-once dispatch per notification row, across processes and
restarts. A database claim error intentionally prevents sending. A crash or send
failure after claiming can lose delivery; automatic retry/outbox delivery is not
implemented. Do not delete claims to retry without first checking delivery.

This does not deduplicate two distinct notification rows, multiple Expo tokens
that route to one installation, or senders outside this BFF. Confirm a particular
incident using the notification row ID and Expo ticket logs. Never print keys.

Verification: `node --import tsx --test tests/notification-dispatch.test.ts`
and `npm run typecheck` from this directory.
