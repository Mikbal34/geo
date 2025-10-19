-- Sample brand
INSERT INTO brands (id, brand_name, domain, region) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'EcoClean', 'ecoclean.com', 'Global');

-- Sample prompts
INSERT INTO prompts (brand_id, prompt_text, is_ai_generated) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'How does EcoClean''s messaging align with current sustainability trends?', true),
('550e8400-e29b-41d4-a716-446655440000', 'What emotional response does the EcoClean brand evoke?', true),
('550e8400-e29b-41d4-a716-446655440000', 'What makes our brand unique in the sustainability market?', false);

-- Sample competitors
INSERT INTO competitors (brand_id, competitor_name, competitor_domain, region, is_ai_generated) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'GreenWash', 'greenwash.com', 'North America', false),
('550e8400-e29b-41d4-a716-446655440000', 'PureEarth', 'pureearth.com', 'Global', true);

-- Sample score
INSERT INTO scores (brand_id, relevance, clarity, consistency, creativity, emotional_impact, reasoning_json, model_used) VALUES
('550e8400-e29b-41d4-a716-446655440000', 82, 76, 71, 85, 88,
'{"Relevance": {"score": 82, "reason": "Strong focus on sustainability resonates with target audience"}, "Clarity": {"score": 76, "reason": "Mostly clear messaging but lacks consistent tagline"}, "Consistency": {"score": 71, "reason": "Brand tone varies between marketing channels"}, "Creativity": {"score": 85, "reason": "Innovative use of storytelling in campaigns"}, "Emotional_Impact": {"score": 88, "reason": "Strong emotional connection through eco-friendly narrative"}}'::jsonb,
'gpt-4-turbo-preview');
