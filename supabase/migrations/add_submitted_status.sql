-- Add 'submitted' to quizzes.status constraint
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_status_check;

ALTER TABLE quizzes
ADD CONSTRAINT quizzes_status_check
CHECK (status IN ('draft', 'sandbox', 'submitted', 'published', 'archived'));
