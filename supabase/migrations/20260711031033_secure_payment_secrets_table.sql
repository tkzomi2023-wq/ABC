-- Create a dedicated secrets table for sensitive payment credentials
-- This table has admin-only RLS so regular users cannot read payment secrets
-- (unlike site_settings which is readable by all authenticated users)

CREATE TABLE IF NOT EXISTS payment_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_key TEXT UNIQUE NOT NULL,
  secret_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_secrets ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for all CRUD operations
CREATE POLICY "select_payment_secrets_admin" ON payment_secrets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "insert_payment_secrets_admin" ON payment_secrets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "update_payment_secrets_admin" ON payment_secrets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "delete_payment_secrets_admin" ON payment_secrets FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Migrate existing Razorpay secrets from site_settings to payment_secrets
INSERT INTO payment_secrets (secret_key, secret_value, description)
SELECT 'razorpay_key_secret', setting_value, 'Razorpay Key Secret'
FROM site_settings
WHERE setting_key = 'razorpay_key_secret'
ON CONFLICT (secret_key) DO NOTHING;

INSERT INTO payment_secrets (secret_key, secret_value, description)
SELECT 'razorpay_webhook_secret', setting_value, 'Razorpay Webhook Secret'
FROM site_settings
WHERE setting_key = 'razorpay_webhook_secret'
ON CONFLICT (secret_key) DO NOTHING;

-- Remove secrets from site_settings (they are now in payment_secrets)
DELETE FROM site_settings WHERE setting_key IN ('razorpay_key_secret', 'razorpay_webhook_secret');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_secrets TO authenticated;

-- Create index
CREATE INDEX IF NOT EXISTS idx_payment_secrets_key ON payment_secrets (secret_key);

-- Auto-update trigger
CREATE TRIGGER update_payment_secrets_updated_at
  BEFORE UPDATE ON payment_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint on blog_posts.slug to prevent race conditions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_slug_key'
  ) THEN
    ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);
  END IF;
END $$;
