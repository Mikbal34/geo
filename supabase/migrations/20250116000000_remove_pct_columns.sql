-- Remove percentage columns from scores_llm and scores_overall
-- Position ve Mentions artık sadece raw değerler

-- scores_llm tablosundan position_pct ve mentions_pct kaldır
ALTER TABLE scores_llm DROP COLUMN IF EXISTS position_pct;
ALTER TABLE scores_llm DROP COLUMN IF EXISTS mentions_pct;

-- scores_overall tablosundan position_pct ve mentions_pct kaldır
ALTER TABLE scores_overall DROP COLUMN IF EXISTS position_pct;
ALTER TABLE scores_overall DROP COLUMN IF EXISTS mentions_pct;

-- scores_overall'a avg_position_raw ekle (yoksa)
ALTER TABLE scores_overall ADD COLUMN IF NOT EXISTS avg_position_raw DECIMAL(5,2);

-- Yorum güncelle
COMMENT ON COLUMN scores_llm.avg_position_raw IS 'Average rank position (lower is better)';
COMMENT ON COLUMN scores_llm.mentions_raw IS 'Total brand mentions count';
COMMENT ON COLUMN scores_overall.avg_position_raw IS 'Weighted average rank position across all LLMs';
COMMENT ON COLUMN scores_overall.mentions_raw_total IS 'Total brand mentions across all LLMs';
