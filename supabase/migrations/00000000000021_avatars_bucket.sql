-- Create avatars storage bucket for child profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars for their family's children
CREATE POLICY "Users can upload avatars for family children"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::text
    FROM children c
    JOIN members m ON m.family_id = c.family_id
    WHERE m.user_id = auth.uid()
  )
);

-- Allow authenticated users to update avatars for their family's children
CREATE POLICY "Users can update avatars for family children"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::text
    FROM children c
    JOIN members m ON m.family_id = c.family_id
    WHERE m.user_id = auth.uid()
  )
);

-- Allow public read access to avatars (they're profile pictures)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their family's children avatars
CREATE POLICY "Users can delete avatars for family children"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IN (
    SELECT c.id::text
    FROM children c
    JOIN members m ON m.family_id = c.family_id
    WHERE m.user_id = auth.uid()
  )
);
