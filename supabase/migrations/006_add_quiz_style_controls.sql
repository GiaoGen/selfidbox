-- Add AI style control columns to quizzes table
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS abstractness integer DEFAULT 50;

ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS seriousness integer DEFAULT 50;

ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS depth integer DEFAULT 50;

ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS poeticness integer DEFAULT 50;
