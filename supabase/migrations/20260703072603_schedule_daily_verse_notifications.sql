/*
# Schedule daily verse push notifications (4 times daily)

1. Cron Jobs
- 7:30 AM IST (02:00 UTC) — Morning daily verse
- 12:00 PM IST (06:30 UTC) — Noon daily verse
- 4:30 PM IST (11:00 UTC) — Afternoon daily verse
- 8:30 PM IST (15:00 UTC) — Evening daily verse
2. Notes
- Each job calls the send-scheduled-notifications edge function with type=daily_verse.
- The edge function sends the same verse of the day to all push subscribers.
- Uses pgnet's net.http_post to invoke the edge function from the database.
*/

-- Unschedule any existing jobs with these names to avoid duplicates
SELECT cron.unschedule('daily-verse-morning') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-verse-morning');
SELECT cron.unschedule('daily-verse-noon') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-verse-noon');
SELECT cron.unschedule('daily-verse-afternoon') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-verse-afternoon');
SELECT cron.unschedule('daily-verse-evening') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-verse-evening');

-- 7:30 AM IST = 02:00 UTC
SELECT cron.schedule(
  'daily-verse-morning',
  '0 2 * * *',
  $$SELECT net.http_post(
    url := '${SUPABASE_URL}/functions/v1/send-scheduled-notifications?type=daily_verse',
    headers := '{"Authorization":"Bearer ${SUPABASE_SERVICE_ROLE_KEY}","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 12:00 PM IST = 06:30 UTC
SELECT cron.schedule(
  'daily-verse-noon',
  '30 6 * * *',
  $$SELECT net.http_post(
    url := '${SUPABASE_URL}/functions/v1/send-scheduled-notifications?type=daily_verse',
    headers := '{"Authorization":"Bearer ${SUPABASE_SERVICE_ROLE_KEY}","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 4:30 PM IST = 11:00 UTC
SELECT cron.schedule(
  'daily-verse-afternoon',
  '0 11 * * *',
  $$SELECT net.http_post(
    url := '${SUPABASE_URL}/functions/v1/send-scheduled-notifications?type=daily_verse',
    headers := '{"Authorization":"Bearer ${SUPABASE_SERVICE_ROLE_KEY}","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 8:30 PM IST = 15:00 UTC
SELECT cron.schedule(
  'daily-verse-evening',
  '0 15 * * *',
  $$SELECT net.http_post(
    url := '${SUPABASE_URL}/functions/v1/send-scheduled-notifications?type=daily_verse',
    headers := '{"Authorization":"Bearer ${SUPABASE_SERVICE_ROLE_KEY}","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);
