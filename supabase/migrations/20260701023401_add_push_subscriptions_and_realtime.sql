/*
# Push Notification Subscriptions + Realtime for Notifications

1. New Tables
- `push_subscriptions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, FK to profiles, ON DELETE CASCADE)
  - `fcm_token` (text, not null) — Firebase Cloud Messaging registration token
  - `device_type` (text, nullable) — 'web', 'android', 'ios' etc.
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  - Unique constraint on (user_id, fcm_token) so re-subscribing updates instead of duplicating

2. Security
- Enable RLS on `push_subscriptions`.
- Users can read/insert/update/delete only their own subscription tokens.
- Scoped to `authenticated` (this is a signed-in app).

3. Realtime
- Add `notifications` table to the `supabase_realtime` publication so the client
  can subscribe to new notification inserts in real time.

4. Notes
- The `fcm_token` is a device-specific push token from FCM. A user may have
  multiple tokens (multiple devices/browsers). The unique constraint prevents
  duplicate rows for the same user+token pair.
- `updated_at` is maintained by a trigger to track when a token was last refreshed.
*/

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fcm_token text NOT NULL,
  device_type text DEFAULT 'web',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, fcm_token)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_push_subscriptions" ON push_subscriptions;
CREATE POLICY "select_own_push_subscriptions" ON push_subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_push_subscriptions" ON push_subscriptions;
CREATE POLICY "insert_own_push_subscriptions" ON push_subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_push_subscriptions" ON push_subscriptions;
CREATE POLICY "update_own_push_subscriptions" ON push_subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_push_subscriptions" ON push_subscriptions;
CREATE POLICY "delete_own_push_subscriptions" ON push_subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
