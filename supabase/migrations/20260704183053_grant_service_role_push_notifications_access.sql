-- Grant service_role access to push_subscriptions and notifications tables
GRANT ALL ON push_subscriptions TO service_role;
GRANT ALL ON notifications TO service_role;