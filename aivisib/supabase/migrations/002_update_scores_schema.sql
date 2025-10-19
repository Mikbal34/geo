-- Drop old scores table
DROP TABLE IF EXISTS scores CASCADE;

-- Create new scores table with dimension-based structure
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    dimension VARCHAR(50) NOT NULL CHECK (dimension IN ('awareness', 'consideration', 'preference', 'purchase_intent', 'loyalty', 'advocacy')),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    reasoning TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_brand_id ON scores(brand_id, created_at DESC);
CREATE INDEX idx_scores_dimension ON scores(brand_id, dimension);
