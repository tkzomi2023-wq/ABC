-- Remove old 4-time daily verse cron jobs
SELECT cron.unschedule('daily-verse-morning') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-verse-morning');
SELECT cron.unschedule('daily-verse-noon') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-verse-noon');
SELECT cron.unschedule('daily-verse-afternoon') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-verse-afternoon');
SELECT cron.unschedule('daily-verse-evening') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-verse-evening');

-- Remove any existing new-name jobs to avoid duplicates
SELECT cron.unschedule('verse-midnight') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verse-midnight');
SELECT cron.unschedule('verse-morning') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verse-morning');
SELECT cron.unschedule('verse-blessed') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verse-blessed');
SELECT cron.unschedule('verse-noon') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verse-noon');
SELECT cron.unschedule('verse-goodafternoon') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verse-goodafternoon');
SELECT cron.unschedule('verse-afternoon') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verse-afternoon');
SELECT cron.unschedule('verse-goodnight1') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verse-goodnight1');
SELECT cron.unschedule('verse-goodnight2') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'verse-goodnight2');

-- 12:00 AM IST = 18:30 UTC
SELECT cron.schedule(
  'verse-midnight',
  '30 18 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse&label=New+Day+Verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 7:00 AM IST = 01:30 UTC
SELECT cron.schedule(
  'verse-morning',
  '30 1 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse&label=Morning+Verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 9:30 AM IST = 04:00 UTC
SELECT cron.schedule(
  'verse-blessed',
  '0 4 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse&label=Blessed+You',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 12:00 PM IST = 06:30 UTC
SELECT cron.schedule(
  'verse-noon',
  '30 6 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse&label=Noon+Verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 5:30 PM IST = 12:00 UTC
SELECT cron.schedule(
  'verse-goodafternoon',
  '0 12 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse&label=Good+Afternoon+Verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 7:30 PM IST = 14:00 UTC
SELECT cron.schedule(
  'verse-afternoon',
  '0 14 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse&label=After+Noon+Verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 9:30 PM IST = 16:00 UTC
SELECT cron.schedule(
  'verse-goodnight1',
  '0 16 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse&label=Good+Night+Verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

-- 10:30 PM IST = 17:00 UTC
SELECT cron.schedule(
  'verse-goodnight2',
  '0 17 * * *',
  $$SELECT net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=daily_verse&label=Good+Night+Verse',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);
