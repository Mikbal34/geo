-- Add llm field to competitor_scores table
ALTER TABLE competitor_scores
ADD COLUMN llm TEXT;

-- Update index to include llm
DROP INDEX IF EXISTS idx_competitor_scores_competitor_id;
CREATE INDEX idx_competitor_scores_competitor_llm ON competitor_scores(competitor_id, llm);

-- Add constraint for llm values
ALTER TABLE competitor_scores
ADD CONSTRAINT competitor_scores_llm_check
CHECK (llm IN ('chatgpt', 'gemini', 'perplexity', 'overall'));
