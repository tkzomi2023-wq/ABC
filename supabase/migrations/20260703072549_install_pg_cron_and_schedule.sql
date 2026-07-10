/*
# Install pg_cron extension for scheduled jobs

1. Extensions
- Install pg_cron extension for scheduling periodic edge function calls.
2. Notes
- pg_cron is a Supabase-supported extension for PostgreSQL cron jobs.
- We will schedule 4 daily verse notifications at 7:30 AM, 12:00 PM, 4:30 PM, 8:30 PM IST (UTC+5:30).
- IST times in UTC: 7:30 AM IST = 02:00 UTC, 12:00 PM IST = 06:30 UTC, 4:30 PM IST = 11:00 UTC, 8:30 PM IST = 15:00 UTC.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
SELECT cron.schedule('daily-verse-morning', '0 2 * * *', $$SELECT net.http_post(url:='${SUPABASE_URL}/functions/v1/send-scheduled-notifications?type=daily_verse', headers:='{"Authorization":"Bearer ${SUPABASE_SERVICE_ROLE_KEY}"}'::jsonb, body: '{}'::jsonb)$$);
