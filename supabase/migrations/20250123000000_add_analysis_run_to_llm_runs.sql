-- Add analysis_run_id to llm_runs to track which analysis run created each LLM response
-- This allows us to store historical LLM responses over time

ALTER TABLE llm_runs
  ADD COLUMN IF NOT EXISTS analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_llm_runs_analysis_run ON llm_runs(analysis_run_id);

-- Add comment
COMMENT ON COLUMN llm_runs.analysis_run_id IS 'Links this LLM response to a specific analysis run, allowing historical tracking';
