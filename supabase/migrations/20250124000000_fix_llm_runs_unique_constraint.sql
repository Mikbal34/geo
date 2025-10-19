-- Fix unique constraint on llm_runs table
-- Old constraint: UNIQUE(prompt_id, llm) prevented historical tracking
-- New constraint: UNIQUE(prompt_id, llm, analysis_run_id) allows multiple runs over time
-- This enables auto-analysis to track score changes across different time intervals

-- Drop the old constraint
ALTER TABLE llm_runs
  DROP CONSTRAINT IF EXISTS llm_runs_prompt_id_llm_key;

-- Add new constraint that includes analysis_run_id
-- This allows the same prompt to be analyzed multiple times (different runs)
-- but prevents duplicate entries within the same run
ALTER TABLE llm_runs
  ADD CONSTRAINT llm_runs_prompt_llm_run_unique
  UNIQUE(prompt_id, llm, analysis_run_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT llm_runs_prompt_llm_run_unique ON llm_runs IS
  'Ensures one LLM response per prompt per analysis run, while allowing historical tracking across multiple runs';
