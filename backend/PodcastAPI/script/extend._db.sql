-- ek scriptler buraya

-- 18.04.2026 tarihinde eklenen kategori verisi
INSERT INTO Interests (Name, Description) VALUES
    ('technology',      'Technology news, new products and industry updates'),
    ('sports',          'Sports news, match results and transfers'),
    ('economy',         'Economy, markets and macro developments'),
    ('health',          'Health, medicine and life sciences'),
    ('science',         'Science, research and discoveries'),
    ('world',           'World affairs and international news'),
    ('ai',              'Artificial intelligence, machine learning and AI tools'),
    ('finance',         'Finance, investments and crypto'),
    ('music',           'Music news and new releases'),
    ('entertainment',   'Entertainment, celebrities and culture')
ON CONFLICT (Name) DO NOTHING;

-- 19.04.2026: transcript (zaman damgalı satırlar) için JSON kolonu.
-- Frontend audio.currentTime ile [{order, speaker, text, startMs, endMs}] dizisini eşleştirip
-- aktif satırı vurgulayabilsin diye podcasts tablosuna eklendi.
ALTER TABLE podcasts
    ADD COLUMN IF NOT EXISTS transcriptjson jsonb;