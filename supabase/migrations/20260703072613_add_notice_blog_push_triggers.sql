/*
# Add triggers for notice and blog post push notifications

1. Functions
- notify_new_notice(): after INSERT on notices, calls the edge function to send push notifications.
- notify_new_blog_post(): after INSERT on blog_posts (when is_published=true), calls the edge function.
2. Triggers
- on_notice_insert: AFTER INSERT on notices
- on_blog_post_insert: AFTER INSERT on blog_posts
3. Notes
- Uses pgnet's net.http_post to invoke the send-scheduled-notifications edge function asynchronously.
- The edge function handles sending to all push subscribers and inserting notification records.
*/

-- Ensure pgnet extension is available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to call the edge function when a new notice is posted
CREATE OR REPLACE FUNCTION public.notify_new_notice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := '${SUPABASE_URL}/functions/v1/send-scheduled-notifications?type=notice',
    headers := '{"Authorization":"Bearer ${SUPABASE_SERVICE_ROLE_KEY}","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Function to call the edge function when a new blog post is published
CREATE OR REPLACE FUNCTION public.notify_new_blog_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_published = true THEN
    PERFORM net.http_post(
      url := '${SUPABASE_URL}/functions/v1/send-scheduled-notifications?type=blog',
      headers := '{"Authorization":"Bearer ${SUPABASE_SERVICE_ROLE_KEY}","Content-Type":"application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS on_notice_insert ON notices;
CREATE TRIGGER on_notice_insert
  AFTER INSERT ON notices
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_notice();

DROP TRIGGER IF EXISTS on_blog_post_insert ON blog_posts;
CREATE TRIGGER on_blog_post_insert
  AFTER INSERT ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_blog_post();
