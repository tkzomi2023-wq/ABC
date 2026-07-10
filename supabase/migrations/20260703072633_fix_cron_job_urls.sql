/*
# Fix cron job URLs with hardcoded values

1. Changes
- Unschedule the 4 daily verse jobs that had uninterpolated ${SUPABASE_URL} placeholders.
- Reschedule with the actual project URL and anon key (edge function has verify_jwt=false).
2. Notes
- The edge function send-scheduled-notifications does not require JWT verification, so the anon key is sufficient.
- IST to UTC: 7:30AM=02:00, 12:00PM=06:30, 4:30PM=11:00, 8:30PM=15:00.
*/

SELECT cron.unschedule('daily-verse-morning');
SELECT cron.unschedule('daily-verse-noon');
SELECT cron.unschedule('daily-verse-afternoon');
SELECT cron.unschedule('daily-verse-evening');

SELECT cron.schedule(
  'daily-verse-morning',
  '0 2 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule(
  'daily-verse-noon',
  '30 6 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule(
  'daily-verse-afternoon',
  '0 11 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule(
  'daily-verse-evening',
  '0 15 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);
