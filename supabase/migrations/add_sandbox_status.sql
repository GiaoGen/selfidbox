-- Add 'sandbox' to quizzes.status constraint
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_status_check;

ALTER TABLE quizzes
ADD CONSTRAINT quizzes_status_check
CHECK (status IN ('draft', 'sandbox', 'published', 'archived'));

-- Add attempt counter
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0;
