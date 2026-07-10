/*
# Create blog_posts table

1. New Tables
- `blog_posts`
  - `id` (uuid, primary key)
  - `title` (text, not null) — short, clear, engaging post title
  - `slug` (text, not null, unique) — URL-safe identifier derived from title, used in /post/:slug route
  - `hashtags` (text[]) — 2–4 relevant hashtags for the topic
  - `author_name` (text, not null) — display name of the author
  - `author_id` (uuid, nullable) — references profiles.id, the user who created the post
  - `featured_image_url` (text, nullable) — main/featured image at the top of the post
  - `intro_text` (text, nullable) — ~2 paragraphs introducing the subject (stored as plain text with double newlines between paragraphs)
  - `supporting_image_url` (text, nullable) — first supporting visual after intro
  - `body_text` (text, nullable) — ~3 paragraphs expanding on the main theme
  - `second_image_url` (text, nullable) — second supporting visual
  - `conclusion_text` (text, nullable) — ~2 paragraphs providing conclusion/reflection
  - `takeaway` (text, nullable) — short takeaway or call-to-action at the end
  - `is_published` (boolean, default false) — whether the post is visible publicly
  - `published_at` (timestamptz, nullable) — when the post was published
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `blog_posts`.
- Public (anon + authenticated) can SELECT only published posts.
- Authenticated admin and faculty can SELECT all posts (including drafts), and INSERT/UPDATE/DELETE any post.
- Ownership is enforced via role check on profiles, not a per-row user_id ownership model, because both admin and faculty may edit any post (shared editorial access).

3. Indexes
- Unique index on `slug` for fast lookups.
- Index on `is_published` + `published_at` for the homepage preview query.

4. Notes
- The slug is generated client-side from the title (lowercased, spaces → hyphens, non-alphanumerics stripped) and deduplicated by appending a short suffix if needed.
- Auto-save of draft progress happens in localStorage on the client; the row is only created in Supabase when the user explicitly saves/publishes.
*/

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  hashtags text[] DEFAULT '{}',
  author_name text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  featured_image_url text,
  intro_text text,
  supporting_image_url text,
  body_text text,
  second_image_url text,
  conclusion_text text,
  takeaway text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
DROP POLICY IF EXISTS "public_read_published_blog_posts" ON blog_posts;
CREATE POLICY "public_read_published_blog_posts"
ON blog_posts FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Admin and faculty can read all posts (including drafts)
DROP POLICY IF EXISTS "staff_read_all_blog_posts" ON blog_posts;
CREATE POLICY "staff_read_all_blog_posts"
ON blog_posts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'faculty')
  )
);

-- Admin and faculty can insert posts
DROP POLICY IF EXISTS "staff_insert_blog_posts" ON blog_posts;
CREATE POLICY "staff_insert_blog_posts"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'faculty')
  )
);

-- Admin and faculty can update posts
DROP POLICY IF EXISTS "staff_update_blog_posts" ON blog_posts;
CREATE POLICY "staff_update_blog_posts"
ON blog_posts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'faculty')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'faculty')
  )
);

-- Admin and faculty can delete posts
DROP POLICY IF EXISTS "staff_delete_blog_posts" ON blog_posts;
CREATE POLICY "staff_delete_blog_posts"
ON blog_posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'faculty')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION set_blog_posts_updated_at();
