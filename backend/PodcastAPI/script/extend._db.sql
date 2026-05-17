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
-- Öğrenme seçimi ve CEFR seviyesi podcast oluştururken verilir (users tablosunda tutulmaz).
-- Öğrenme modunda podcast CEFR seviyesinde üretilir; transcript Türkçe çevirileriyle döner.

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

-- 07.05.2026: preferredmode / cefrlevel users'dan kaldırıldı (sadece podcast bazında).
ALTER TABLE users DROP COLUMN IF EXISTS preferredmode;
ALTER TABLE users DROP COLUMN IF EXISTS cefrlevel;

-- 16.05.2026: Profil fotoğrafı URL'i.
ALTER TABLE users ADD COLUMN IF NOT EXISTS photourl TEXT;

-- 16.05.2026: Dinleme geçmişi (Recently Played + "kaldığı yer" takibi).
-- Kullanıcının hangi podcast'i, ne kadar dinlediğini ve tamamlayıp tamamlamadığını tutar.
CREATE TABLE IF NOT EXISTS listeninghistory (
    id              SERIAL PRIMARY KEY,
    userid          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    podcastid       UUID         NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    progressseconds INT          NOT NULL DEFAULT 0,
    iscompleted     BOOLEAN      NOT NULL DEFAULT FALSE,
    lastlistenedat  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userid, podcastid)
);

CREATE INDEX IF NOT EXISTS idx_listeninghistory_user ON listeninghistory(userid, lastlistenedat DESC);