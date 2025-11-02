-- Create storage bucket for actus images
INSERT INTO storage.buckets (id, name, public)
VALUES ('actus-images', 'actus-images', true);

-- Create policy to allow public read access
CREATE POLICY "Public can view actus images"
ON storage.objects FOR SELECT
USING (bucket_id = 'actus-images');

-- Create policy to allow admins to upload
CREATE POLICY "Admins can upload actus images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'actus-images' AND
  is_admin(auth.uid())
);

-- Create policy to allow admins to update
CREATE POLICY "Admins can update actus images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'actus-images' AND
  is_admin(auth.uid())
);

-- Create policy to allow admins to delete
CREATE POLICY "Admins can delete actus images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'actus-images' AND
  is_admin(auth.uid())
);