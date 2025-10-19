-- LLM Runs Table: Her LLM'in her prompt için verdiği cevabı saklar
CREATE TABLE IF NOT EXISTS llm_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  llm TEXT NOT NULL CHECK (llm IN ('chatgpt', 'gemini', 'perplexity')),
  response_text TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb, -- [{ url, rank, title }]
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, llm) -- Her prompt için her LLM'den bir kez çalıştır
);

-- LLM Scores Table: Her LLM için hesaplanan metrikler
CREATE TABLE IF NOT EXISTS scores_llm (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  llm TEXT NOT NULL CHECK (llm IN ('chatgpt', 'gemini', 'perplexity')),
  visibility_pct DECIMAL(5,2) NOT NULL, -- 0-100
  avg_position_raw DECIMAL(5,2), -- Ortalama sıralama (null olabilir)
  position_pct DECIMAL(5,2), -- Normalize edilmiş sıralama skoru
  sentiment_pct DECIMAL(5,2) NOT NULL, -- 0-100
  mentions_raw INTEGER NOT NULL, -- Ham mention sayısı
  mentions_pct DECIMAL(5,2) NOT NULL, -- Normalize edilmiş mention skoru
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, llm, created_at) -- Her analiz için bir kayıt
);

-- Overall Scores Table: Tüm LLM'lerin agregasyonu
CREATE TABLE IF NOT EXISTS scores_overall (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  visibility_pct DECIMAL(5,2) NOT NULL,
  position_pct DECIMAL(5,2),
  sentiment_pct DECIMAL(5,2) NOT NULL,
  mentions_pct DECIMAL(5,2) NOT NULL,
  mentions_raw_total INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_llm_runs_brand ON llm_runs(brand_id);
CREATE INDEX IF NOT EXISTS idx_llm_runs_prompt ON llm_runs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_llm_runs_llm ON llm_runs(llm);
CREATE INDEX IF NOT EXISTS idx_scores_llm_brand ON scores_llm(brand_id);
CREATE INDEX IF NOT EXISTS idx_scores_overall_brand ON scores_overall(brand_id);

-- Comments
COMMENT ON TABLE llm_runs IS 'Stores each LLM response for each prompt';
COMMENT ON TABLE scores_llm IS 'Calculated metrics per LLM per brand';
COMMENT ON TABLE scores_overall IS 'Aggregated metrics across all LLMs per brand';
