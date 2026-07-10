/*
# Add per-user transaction visibility and certificate ID columns

1. Changes to `profiles` table:
   - `show_transactions_public` (boolean, default false): Per-user toggle controlling whether
     the user's transaction history is visible to everyone (true) or only to the user and
     admins (false). Replaces the global `show_transactions_public` site_setting.
   - `certificate_id` (text, nullable): Stores a custom certificate ID for graduated students.
     When set, this value is used on the certificate instead of the auto-generated
     `ABC-{year}-{id-prefix}` format. Admins can set/modify this from the certificate
     management tab.

2. Security:
   - No RLS policy changes needed — existing profile policies already cover these columns.
   - Both columns are optional and default safely (false / null).

3. Notes:
   - The old global `show_transactions_public` site_setting is no longer used by the UI but
     is left in place to avoid data loss.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_transactions_public boolean NOT NULL DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS certificate_id text;
