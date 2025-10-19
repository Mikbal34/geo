-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brands table
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    region VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT domain_format CHECK (domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$')
);

CREATE INDEX idx_brands_created_at ON brands(created_at DESC);

-- Prompts table
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT prompt_text_length CHECK (LENGTH(prompt_text) BETWEEN 10 AND 2000)
);

CREATE INDEX idx_prompts_brand_id ON prompts(brand_id, created_at DESC);

-- Competitors table
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    competitor_name VARCHAR(255) NOT NULL,
    competitor_domain VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT competitor_domain_format CHECK (competitor_domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$'),
    CONSTRAINT unique_competitor_per_brand UNIQUE (brand_id, competitor_domain)
);

CREATE INDEX idx_competitors_brand_id ON competitors(brand_id, created_at DESC);

-- Scores table
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    relevance INTEGER NOT NULL CHECK (relevance >= 0 AND relevance <= 100),
    clarity INTEGER NOT NULL CHECK (clarity >= 0 AND clarity <= 100),
    consistency INTEGER NOT NULL CHECK (consistency >= 0 AND consistency <= 100),
    creativity INTEGER NOT NULL CHECK (creativity >= 0 AND creativity <= 100),
    emotional_impact INTEGER NOT NULL CHECK (emotional_impact >= 0 AND emotional_impact <= 100),
    reasoning_json JSONB NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    analysis_duration_ms INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_brand_id ON scores(brand_id, created_at DESC);

-- Update trigger for brands.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
