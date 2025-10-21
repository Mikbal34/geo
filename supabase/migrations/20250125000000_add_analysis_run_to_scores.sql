-- Add analysis_run_id to scores tables for historical tracking and consistent snapshots
-- This ensures all scores from the same analysis run can be queried together

-- 1. Add analysis_run_id to scores_overall
ALTER TABLE scores_overall
  ADD COLUMN IF NOT EXISTS analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE;

-- 2. Add analysis_run_id to scores_llm
ALTER TABLE scores_llm
  ADD COLUMN IF NOT EXISTS analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE;

-- 3. Add analysis_run_id to competitor_scores
ALTER TABLE competitor_scores
  ADD COLUMN IF NOT EXISTS analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE;

-- 4. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_scores_overall_analysis_run ON scores_overall(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_scores_llm_analysis_run ON scores_llm(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_competitor_scores_analysis_run ON competitor_scores(analysis_run_id);

-- 5. Create composite index for brand + run queries
CREATE INDEX IF NOT EXISTS idx_scores_overall_brand_run ON scores_overall(brand_id, analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_scores_llm_brand_run ON scores_llm(brand_id, analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_competitor_scores_brand_run ON competitor_scores(brand_id, analysis_run_id);

-- 6. Migrate existing data: Link scores to closest analysis_run by timestamp
-- For scores_overall
UPDATE scores_overall so
SET analysis_run_id = ar.id
FROM analysis_runs ar
WHERE so.brand_id = ar.brand_id
  AND so.analysis_run_id IS NULL
  AND ar.id = (
    SELECT id FROM analysis_runs
    WHERE brand_id = so.brand_id
      AND ABS(EXTRACT(EPOCH FROM (created_at - so.created_at))) < 300 -- 5 minutes tolerance
    ORDER BY ABS(EXTRACT(EPOCH FROM (created_at - so.created_at)))
    LIMIT 1
  );

-- For scores_llm
UPDATE scores_llm sl
SET analysis_run_id = ar.id
FROM analysis_runs ar
WHERE sl.brand_id = ar.brand_id
  AND sl.analysis_run_id IS NULL
  AND ar.id = (
    SELECT id FROM analysis_runs
    WHERE brand_id = sl.brand_id
      AND ABS(EXTRACT(EPOCH FROM (created_at - sl.created_at))) < 300 -- 5 minutes tolerance
    ORDER BY ABS(EXTRACT(EPOCH FROM (created_at - sl.created_at)))
    LIMIT 1
  );

-- For competitor_scores
UPDATE competitor_scores cs
SET analysis_run_id = ar.id
FROM analysis_runs ar
WHERE cs.brand_id = ar.brand_id
  AND cs.analysis_run_id IS NULL
  AND ar.id = (
    SELECT id FROM analysis_runs
    WHERE brand_id = cs.brand_id
      AND ABS(EXTRACT(EPOCH FROM (created_at - cs.created_at))) < 300 -- 5 minutes tolerance
    ORDER BY ABS(EXTRACT(EPOCH FROM (created_at - cs.created_at)))
    LIMIT 1
  );

-- 7. Add comments
COMMENT ON COLUMN scores_overall.analysis_run_id IS 'Links this score to a specific analysis run for historical tracking and consistent snapshots';
COMMENT ON COLUMN scores_llm.analysis_run_id IS 'Links this score to a specific analysis run for historical tracking and consistent snapshots';
COMMENT ON COLUMN competitor_scores.analysis_run_id IS 'Links this score to a specific analysis run for historical tracking and consistent snapshots';
