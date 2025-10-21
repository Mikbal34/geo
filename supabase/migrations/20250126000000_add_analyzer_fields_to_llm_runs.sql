-- Add analyzer result fields to llm_runs table
-- These fields are populated by GPT-4o-mini analyzer instead of regex-based detection

-- Add position column (1st, 2nd, 3rd position in ranked lists)
ALTER TABLE llm_runs
  ADD COLUMN IF NOT EXISTS position INTEGER NULL;

-- Add mentions_count column (how many times brand name appears)
ALTER TABLE llm_runs
  ADD COLUMN IF NOT EXISTS mentions_count INTEGER DEFAULT 0;

COMMENT ON COLUMN llm_runs.position IS 'Brand position in ranked list (1=first, 2=second, etc.) detected by GPT-4o-mini analyzer';
COMMENT ON COLUMN llm_runs.mentions_count IS 'Number of times brand name is mentioned, detected by GPT-4o-mini analyzer';

-- Create index for filtering by position
CREATE INDEX IF NOT EXISTS idx_llm_runs_position ON llm_runs(position) WHERE position IS NOT NULL;
