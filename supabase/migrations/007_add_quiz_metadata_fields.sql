-- Add metadata columns to quizzes table for Admin management
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES test_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
