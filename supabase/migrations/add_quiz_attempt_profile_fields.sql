-- Add profile fusion columns to quiz_attempts
ALTER TABLE quiz_attempts
ADD COLUMN IF NOT EXISTS included_in_profile boolean DEFAULT true;

ALTER TABLE quiz_attempts
ADD COLUMN IF NOT EXISTS profile_weight numeric DEFAULT 0.3;

ALTER TABLE quiz_attempts
ADD COLUMN IF NOT EXISTS fused_into_profile boolean DEFAULT false;

-- Existing attempts that are already included should be picked up by next fusion run
-- (fused_into_profile defaults to false, so no backfill needed)

-- Index for finding unfused attempts for a user
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_unfused
ON quiz_attempts (user_id, included_in_profile, fused_into_profile)
WHERE included_in_profile = true AND fused_into_profile = false;

