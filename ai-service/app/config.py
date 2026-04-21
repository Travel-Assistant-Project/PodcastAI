from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """ai-service ortam değişkenleri.

    .env dosyası ai-service klasörünün altında bulunmalı.
    """

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    AI_SERVICE_SECRET: str = Field(
        default="",
        description="Backend ile paylaşılan X-Internal-Secret header değeri",
    )

    NEWS_API_KEY: str = Field(default="", description="NewsAPI anahtarı")
    OPENROUTER_API_KEY: str = Field(default="", description="OpenRouter anahtarı")
    ELEVENLABS_API_KEY: str = Field(default="", description="ElevenLabs anahtarı")

    OPENROUTER_MODEL: str = Field(
        default="openai/gpt-4o-mini",
        description="OpenRouter'da kullanılacak LLM modeli",
    )

    ELEVENLABS_VOICE_HOST1: str = Field(
        default="pNInz6obpgDQGcFmaJgB",  # Adam (erkek)
        description="1. sunucunun ElevenLabs voice_id'si",
    )
    ELEVENLABS_VOICE_HOST2: str = Field(
        default="EXAVITQu4vr4xnSDxMaL",  # Bella (kadın)
        description="2. sunucunun ElevenLabs voice_id'si",
    )
    ELEVENLABS_MODEL: str = Field(
        default="eleven_multilingual_v2",
        description="Türkçe destekleyen çok dilli TTS modeli",
    )

    # Üretilen mp3'lerin GEÇİCİ olarak yazılacağı dizin.
    # Firebase'e yüklemeden önce pydub'ın diske mp3 yazması gerekiyor; yükleme
    # sonrası bu dosyalar silinir. Firebase kapalıyken (fallback) backend'in
    # wwwroot/podcasts/ klasörü kullanılabilir.
    PODCAST_AUDIO_DIR: str = Field(
        default=str(Path(__file__).resolve().parents[1] / "tmp" / "podcasts"),
        description="mp3'lerin geçici olarak yazılacağı dizin (absolute path)",
    )

    # ai-service'ın döndürdüğü URL'in public prefix'i.
    PUBLIC_AUDIO_BASE_URL: str = Field(
        default="http://localhost:5192/podcasts",
        description="mp3 URL tabanı (sonunda slash yok)",
    )

    # --- Kademeli mock bayrakları ---
    # Her bileşen için true ise sahte veri döner, false ise gerçek API çağrılır.
    MOCK_NEWS: bool = Field(default=False, description="NewsAPI yerine mock veri")
    MOCK_SCRIPT: bool = Field(default=True, description="OpenRouter yerine mock script")
    MOCK_TTS: bool = Field(default=True, description="ElevenLabs yerine mock ses")

    # NewsAPI başına her kategoriden en fazla kaç haber çekelim.
    NEWS_PER_CATEGORY: int = Field(default=5, ge=1, le=20)

    # --- Firebase Storage ---
    USE_FIREBASE_STORAGE: bool = Field(
        default=False,
        description="True ise üretilen mp3 Firebase Storage'a yüklenir ve public URL döner.",
    )
    FIREBASE_CREDENTIALS_PATH: str = Field(
        default=str(Path(__file__).resolve().parents[1] / "firebase-credentials.json"),
        description="Firebase service account JSON dosyasının absolute path'i.",
    )
    FIREBASE_STORAGE_BUCKET: str = Field(
        default="",
        description="Firebase Storage bucket adı (örn. podcastai-8e385.firebasestorage.app)",
    )
    FIREBASE_PODCAST_FOLDER: str = Field(
        default="podcasts",
        description="Bucket içinde mp3'lerin yükleneceği klasör.",
    )


settings = Settings()

# .env değişikliklerinin fark edilmesi için uvicorn --reload'u tetiklemek adına
# bu dosyanın son değiştirilme zamanına bakılır.

