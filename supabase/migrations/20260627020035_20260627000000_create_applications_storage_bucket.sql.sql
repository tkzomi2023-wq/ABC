-- Create storage bucket for application form uploads (photos and signatures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'applications',
  'applications',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for applications bucket
-- Allow authenticated users to upload their own application files
CREATE POLICY "Anyone can view application files" ON storage.objects
  FOR SELECT USING (bucket_id = 'applications');

CREATE POLICY "Authenticated users can upload application files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'applications');

CREATE POLICY "Users can update their own application files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'applications');

CREATE POLICY "Users can delete their own application files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'applications');
