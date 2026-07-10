-- Add optional YouTube link field to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS youtube_url text;