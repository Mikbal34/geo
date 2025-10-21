-- Set default auto-analysis interval to 24 hours (1440 minutes)
-- This ensures all new brands automatically have daily analysis enabled

-- Update existing NULL values to 1440 (24 hours)
UPDATE brands
SET auto_analysis_interval = 1440
WHERE auto_analysis_interval IS NULL;

-- Set column default for future inserts
ALTER TABLE brands
ALTER COLUMN auto_analysis_interval SET DEFAULT 1440;

-- Set auto_analysis_enabled default to true
ALTER TABLE brands
ALTER COLUMN auto_analysis_enabled SET DEFAULT true;

-- Add comment
COMMENT ON COLUMN brands.auto_analysis_interval IS 'Auto-analysis interval in minutes. Default: 1440 (24 hours)';
