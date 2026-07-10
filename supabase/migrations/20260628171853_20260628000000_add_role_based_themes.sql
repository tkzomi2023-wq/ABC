-- Add role-based theme settings to site_settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, description)
VALUES
  ('theme_role_admin', 'royal-gold', 'text', 'Theme for admin role'),
  ('theme_role_faculty', 'emerald', 'text', 'Theme for faculty role'),
  ('theme_role_student', 'classic', 'text', 'Theme for student role'),
  ('theme_role_standard', 'classic', 'text', 'Theme for standard role'),
  ('theme_role_finance', 'classic', 'text', 'Theme for finance role'),
  ('theme_graduated', 'crimson', 'text', 'Theme for graduated students'),
  ('theme_banned', 'midnight', 'text', 'Theme for banned users')
ON CONFLICT (setting_key) DO NOTHING;
