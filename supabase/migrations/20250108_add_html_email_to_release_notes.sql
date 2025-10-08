-- Add HTML email copy column to release_notes table
-- This allows us to store both plain text (markdown) and styled HTML versions

ALTER TABLE release_notes
ADD COLUMN IF NOT EXISTS email_html TEXT;

-- Add comment to document the column
COMMENT ON COLUMN release_notes.email_html IS 'Styled HTML version of the email for preview';
