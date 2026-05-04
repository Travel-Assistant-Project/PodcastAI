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

    -- 23.04.2026: Transcript (zaman damgalı konuşma metni) desteği.
-- AI servisinden gelen [{speaker, text, startMs, endMs}] şeklindeki detaylı 
-- konuşma verilerini saklayabilmek için podcasts tablosuna eklendi.
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS transcriptjson jsonb;

-- 03.05.2026: Dil öğrenme modu (CEFR + çeviri + kelime defteri).
-- Onboarding'de kullanıcı "sadece dinle" / "öğren" seçer; öğrenme modunda
-- her podcast bir CEFR seviyesinde üretilir, transcript satırları Türkçe çevirileriyle
-- (textTr) jsonb içinde döner, kullanıcının tıkladığı kelimeler defterinde toplanır.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS preferredmode VARCHAR(10),     -- 'listen' | 'learn' | NULL (henüz seçilmemiş)
    ADD COLUMN IF NOT EXISTS cefrlevel     VARCHAR(4);      -- 'A1'..'C2'

ALTER TABLE podcasts
    ADD COLUMN IF NOT EXISTS cefrlevel    VARCHAR(4),       -- NULL ise sade dinleme podcast'i
    ADD COLUMN IF NOT EXISTS learningmode BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_podcasts_cefr          ON podcasts(cefrlevel);
CREATE INDEX IF NOT EXISTS idx_podcasts_user_learning ON podcasts(userid, learningmode);

-- Kelime çevirisi cache (global, kullanıcılar arası paylaşılır).
-- (word, sourcelang, targetlang, contexthash) tekildir; ContextHash NULL = bağlamsız genel çeviri.
CREATE TABLE IF NOT EXISTS wordtranslationcache (
    Id           SERIAL PRIMARY KEY,
    Word         VARCHAR(80)  NOT NULL,
    SourceLang   VARCHAR(5)   NOT NULL DEFAULT 'en',
    TargetLang   VARCHAR(5)   NOT NULL DEFAULT 'tr',
    ContextHash  VARCHAR(64),
    Translation  TEXT         NOT NULL,
    PartOfSpeech VARCHAR(20),
    ExampleEn    TEXT,
    ExampleTr    TEXT,
    CreatedAt    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NULL'lı UNIQUE'i Postgres "her NULL farklıdır" diye saydığı için iki ayrı kısmi index kullanıyoruz.
CREATE UNIQUE INDEX IF NOT EXISTS ux_wordcache_with_ctx
    ON wordtranslationcache(Word, SourceLang, TargetLang, ContextHash)
    WHERE ContextHash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_wordcache_no_ctx
    ON wordtranslationcache(Word, SourceLang, TargetLang)
    WHERE ContextHash IS NULL;

-- Kullanıcının kelime defteri (tıkladığı / kaydettiği kelimeler).
CREATE TABLE IF NOT EXISTS userwords (
    Id              SERIAL PRIMARY KEY,
    UserId          UUID REFERENCES users(Id) ON DELETE CASCADE,
    PodcastId       UUID REFERENCES podcasts(Id) ON DELETE SET NULL,
    Word            VARCHAR(80) NOT NULL,
    ContextSentence TEXT,
    Translation     TEXT,
    IsLearned       BOOLEAN DEFAULT FALSE,
    LookupCount     INT DEFAULT 1,
    CreatedAt       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(UserId, Word)
);
CREATE INDEX IF NOT EXISTS idx_userwords_user ON userwords(UserId, IsLearned);

-- Quiz iskeleti (faz 5'te aktif olacak, şimdilik sadece şema hazır).
CREATE TABLE IF NOT EXISTS userquizattempts (
    Id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId        UUID REFERENCES users(Id)    ON DELETE CASCADE,
    PodcastId     UUID REFERENCES podcasts(Id) ON DELETE CASCADE,
    QuestionsJson JSONB NOT NULL,         -- [{word, options[], correctIndex}]
    AnswersJson   JSONB,                  -- [{word, selectedIndex, correct}]
    Score         INT,
    CreatedAt     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);