-- Create analysis_runs table to track all analysis executions
CREATE TABLE IF NOT EXISTS analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  run_type VARCHAR(20) DEFAULT 'scheduled' CHECK (run_type IN ('manual', 'scheduled')),

  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),

  -- Snapshot of overall scores at this run
  visibility_pct NUMERIC(5,2),
  sentiment_pct NUMERIC(5,2),
  avg_position_raw NUMERIC(5,2),
  mentions_raw_total INT,

  -- Execution stats
  total_prompts INT,
  successful_llm_runs INT,
  failed_llm_runs INT,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_analysis_runs_brand_created ON analysis_runs(brand_id, created_at DESC);
CREATE INDEX idx_analysis_runs_status ON analysis_runs(status);

-- Add comment
COMMENT ON TABLE analysis_runs IS 'Tracks all analysis executions (manual and scheduled) with historical score snapshots';
