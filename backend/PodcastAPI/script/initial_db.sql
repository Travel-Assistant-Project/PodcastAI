-- Kullanıcı ana tablosu
CREATE TABLE Users (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    PasswordHash TEXT NOT NULL,
    Age INT,
    Job VARCHAR(100),
    DailyNotificationTime TIME DEFAULT '08:00',
    LanguagePreference VARCHAR(10) DEFAULT 'tr-TR',
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- İlgi alanları (Teknoloji, Spor vb.)
CREATE TABLE Interests (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(50) UNIQUE NOT NULL,
    Description TEXT
);

-- Kullanıcı ve İlgi Alanı İlişkisi (Çoka çok)
CREATE TABLE UserInterests (
    UserId UUID REFERENCES Users(Id) ON DELETE CASCADE,
    InterestId INT REFERENCES Interests(Id) ON DELETE CASCADE,
    PRIMARY KEY (UserId, InterestId)
);

-- Podcast ana tablosu
CREATE TABLE Podcasts (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID REFERENCES Users(Id), -- Kişiye özel üretildiği için
    Title VARCHAR(255),
    ScriptText TEXT, -- AI tarafından üretilen metin
    AudioUrl TEXT,   -- Firebase/S3 linki
    DurationSeconds INT,
    Tone VARCHAR(20), -- resmi, samimi, eğlenceli
    SpeakerCount INT DEFAULT 2, -- 1 veya 2 sunucu
    Status VARCHAR(20), -- 'pending', 'processing', 'completed', 'failed'
    CategoryName VARCHAR(50), -- Ana kategori
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Podcast'in hangi haberlerden türetildiği (Şeffaflık için)
CREATE TABLE PodcastSources (
    Id SERIAL PRIMARY KEY,
    PodcastId UUID REFERENCES Podcasts(Id) ON DELETE CASCADE,
    SourceName VARCHAR(100), -- Örn: BBC, ShiftDelete
    NewsTitle TEXT,
    NewsUrl TEXT,
    PublishedAt TIMESTAMP WITH TIME ZONE
);

-- Dinleme geçmişi ve "Nerede kaldım?" mantığı
CREATE TABLE ListeningHistory (
    Id SERIAL PRIMARY KEY,
    UserId UUID REFERENCES Users(Id) ON DELETE CASCADE,
    PodcastId UUID REFERENCES Podcasts(Id) ON DELETE CASCADE,
    ProgressSeconds INT DEFAULT 0, -- Saniye cinsinden kalınan yer
    IsCompleted BOOLEAN DEFAULT FALSE,
    LastListenedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Favoriler
CREATE TABLE Favorites (
    UserId UUID REFERENCES Users(Id) ON DELETE CASCADE,
    PodcastId UUID REFERENCES Podcasts(Id) ON DELETE CASCADE,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserId, PodcastId)
);

-- Manuel Text-to-Speech istekleri
CREATE TABLE ManualTtsRequests (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId UUID REFERENCES Users(Id),
    InputText TEXT NOT NULL,
    OutputAudioUrl TEXT,
    Status VARCHAR(20),
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bildirimler
CREATE TABLE Notifications (
    Id SERIAL PRIMARY KEY,
    UserId UUID REFERENCES Users(Id) ON DELETE CASCADE,
    Title VARCHAR(100),
    Message TEXT,
    IsRead BOOLEAN DEFAULT FALSE,
    Type VARCHAR(30), -- 'daily_podcast', 'system', 'marketing'
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
