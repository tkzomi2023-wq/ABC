/*
# Add show_transactions_public and certificate_id to profiles

1. Changes to `profiles`:
   - `show_transactions_public` boolean NOT NULL DEFAULT false — per-user toggle for transaction visibility
   - `certificate_id` text nullable — custom certificate ID for graduated students
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_transactions_public boolean NOT NULL DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS certificate_id text;
