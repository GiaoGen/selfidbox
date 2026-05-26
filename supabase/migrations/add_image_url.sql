-- Add image_url column to quiz_results
ALTER TABLE quiz_results
ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for result images
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-result-images', 'quiz-result-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to result images
DROP POLICY IF EXISTS "Public read for quiz images" ON storage.objects;
CREATE POLICY "Public read for quiz images"
ON storage.objects FOR SELECT
USING (bucket_id = 'quiz-result-images');

-- Allow authenticated uploads
DROP POLICY IF EXISTS "Auth upload to quiz images" ON storage.objects;
CREATE POLICY "Auth upload to quiz images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quiz-result-images');
