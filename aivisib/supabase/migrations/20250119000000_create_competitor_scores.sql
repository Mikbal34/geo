-- Create competitor_scores table
CREATE TABLE IF NOT EXISTS competitor_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Same scoring fields as scores_overall
  visibility_pct DECIMAL(5, 2) NOT NULL DEFAULT 0,
  avg_position_raw DECIMAL(5, 2),
  sentiment_pct DECIMAL(5, 2) NOT NULL DEFAULT 50,
  mentions_raw_total INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_competitor_scores_competitor_id ON competitor_scores(competitor_id);
CREATE INDEX idx_competitor_scores_brand_id ON competitor_scores(brand_id);
CREATE INDEX idx_competitor_scores_created_at ON competitor_scores(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_competitor_scores_updated_at
  BEFORE UPDATE ON competitor_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
