/*
# Fix trigger functions with hardcoded URL

1. Changes
- Recreate notify_new_notice() and notify_new_blog_post() with the actual project URL.
- The edge function has verify_jwt=false so no auth header is needed.
2. Notes
- Triggers fire AFTER INSERT on notices and blog_posts respectively.
*/

CREATE OR REPLACE FUNCTION public.notify_new_notice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=notice',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_blog_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_published = true THEN
    PERFORM net.http_post(
      url := 'https://btgdrgabotjenoruzncr.supabase.co/functions/v1/send-scheduled-notifications?type=blog',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;
