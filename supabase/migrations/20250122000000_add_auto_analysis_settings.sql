-- Add auto-analysis settings to brands table
-- Allows users to configure automatic analysis intervals per brand

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS auto_analysis_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_analysis_interval INTEGER DEFAULT 1440, -- in minutes (default: 24 hours)
  ADD COLUMN IF NOT EXISTS last_auto_analysis_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN brands.auto_analysis_enabled IS 'Whether automatic analysis is enabled for this brand';
COMMENT ON COLUMN brands.auto_analysis_interval IS 'Auto-analysis interval in minutes (e.g., 5 for 5 minutes, 1440 for 24 hours)';
COMMENT ON COLUMN brands.last_auto_analysis_at IS 'Timestamp of the last automatic analysis run';

-- Create index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_brands_auto_analysis ON brands(auto_analysis_enabled, last_auto_analysis_at)
  WHERE auto_analysis_enabled = true;
