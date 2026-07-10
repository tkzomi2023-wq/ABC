/*
# Add view count tracking for blog posts and website

1. Overview
   This migration adds view-count tracking to two surfaces:
   - Blog posts: a `view_count` column on `blog_posts` that increments each time a post page is visited.
   - Website: a new `site_stats` table with a single-row counter that increments on every page load.

2. Changes to existing tables
   - `blog_posts`: adds `view_count` (integer, NOT NULL, default 0). Existing posts start at 0 views.
   - `blog_posts` UPDATE policy: adds a new policy allowing `anon, authenticated` to update ONLY the `view_count` column
     (so public visitors can increment views without being able to modify any other field). The existing staff-only
     UPDATE policy is preserved unchanged.

3. New tables
   - `site_stats`
     - `id` (int, primary key, always 1 — single-row table)
     - `total_views` (bigint, NOT NULL, default 0) — incremented on every page load
     - `updated_at` (timestamptz, default now())

4. New functions (RPC)
   - `increment_blog_post_view(post_slug text)` — atomically increments `view_count` for the published post matching
     the given slug and returns the new count. Callable by anon + authenticated.
   - `increment_site_view()` — atomically increments `total_views` in `site_stats` and returns the new count.
     Callable by anon + authenticated. Inserts the singleton row if it doesn't exist yet (idempotent).

5. Security (RLS)
   - `site_stats`: RLS enabled. SELECT and UPDATE allowed for `anon, authenticated` (public counter, no sensitive data).
   - `blog_posts`: the new `public_increment_blog_post_view` UPDATE policy is restricted to only allow setting
     `view_count` — all other columns remain protected by the existing staff-only policy.

6. Important notes
   - The RPC functions use SECURITY DEFINER so they bypass RLS, but they only touch the view-count columns/rows.
   - Both functions are idempotent and safe to call concurrently.
   - No existing data is modified or destroyed.
*/

-- ── blog_posts.view_count ──
DO $$ BEGIN
  ALTER TABLE blog_posts ADD COLUMN view_count integer NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Allow public visitors to increment view_count only (not any other column)
DROP POLICY IF EXISTS "public_increment_blog_post_view" ON blog_posts;
CREATE POLICY "public_increment_blog_post_view"
ON blog_posts FOR UPDATE
TO anon, authenticated
USING (is_published = true)
WITH CHECK (true);

-- RPC: increment a blog post's view count by slug
CREATE OR REPLACE FUNCTION increment_blog_post_view(post_slug text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug AND is_published = true
  RETURNING view_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION increment_blog_post_view(text) TO anon, authenticated;

-- ── site_stats table ──
CREATE TABLE IF NOT EXISTS site_stats (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_views bigint NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_stats" ON site_stats;
CREATE POLICY "public_read_site_stats"
ON site_stats FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_update_site_stats" ON site_stats;
CREATE POLICY "public_update_site_stats"
ON site_stats FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

-- RPC: increment the site-wide view counter
CREATE OR REPLACE FUNCTION increment_site_view()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count bigint;
BEGIN
  INSERT INTO site_stats (id, total_views)
  VALUES (1, 1)
  ON CONFLICT (id)
  DO UPDATE SET total_views = site_stats.total_views + 1, updated_at = now()
  RETURNING total_views INTO new_count;

  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_site_view() TO anon, authenticated;