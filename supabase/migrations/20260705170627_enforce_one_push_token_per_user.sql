-- Drop the old composite unique index (user_id, fcm_token) and enforce one token per user
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fcm_token_key;
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_user_id_unique ON push_subscriptions (user_id);