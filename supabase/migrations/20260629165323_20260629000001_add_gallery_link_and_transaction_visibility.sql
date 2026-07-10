-- Add link_url to photos table for gallery link feature
ALTER TABLE photos ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add transaction history visibility setting
INSERT INTO site_settings (setting_key, setting_value, setting_type, description)
VALUES ('show_transactions_public', 'false', 'text', 'Show transaction history on public profiles')
ON CONFLICT (setting_key) DO NOTHING;
