-- Update role-based theme defaults to use new professional theme IDs
UPDATE site_settings SET setting_value = 'sterling' WHERE setting_key = 'theme_role_finance';
UPDATE site_settings SET setting_value = 'restricted' WHERE setting_key = 'theme_banned';
UPDATE site_settings SET setting_value = 'royal-gold' WHERE setting_key = 'theme_role_admin';
UPDATE site_settings SET setting_value = 'emerald' WHERE setting_key = 'theme_role_faculty';
UPDATE site_settings SET setting_value = 'classic' WHERE setting_key = 'theme_role_student';
UPDATE site_settings SET setting_value = 'classic' WHERE setting_key = 'theme_role_standard';
UPDATE site_settings SET setting_value = 'crimson' WHERE setting_key = 'theme_graduated';

-- Also update any users who had the old 'midnight' banned theme or 'classic' finance theme
UPDATE profiles SET profile_theme = 'restricted' WHERE is_banned = true AND (profile_theme = 'midnight' OR profile_theme IS NULL);
UPDATE profiles SET profile_theme = 'sterling' WHERE role = 'finance' AND (profile_theme = 'classic' OR profile_theme IS NULL);
