from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class GeneratePodcastRequest(BaseModel):
    """Backend'den gelen iç çağrı payload'ı."""

    podcastId: UUID
    categories: list[str] = Field(default_factory=list)
    tone: str
    durationMinutes: int
    speakerCount: int
    language: str = "en"
    learningMode: bool = False
    cefrLevel: Optional[str] = None  # 'A1'..'C2'


class PodcastAudioPhaseRequest(BaseModel):
    """Senaryo hazırken ardından TTS + zamanlı transcript için."""

    podcastId: UUID
    scriptText: str
    speakerCount: int
    durationMinutes: int
    language: str = "en"
    learningMode: bool = False
    cefrLevel: Optional[str] = None


class NewsSource(BaseModel):
    sourceName: Optional[str] = None
    newsTitle: Optional[str] = None
    newsUrl: Optional[str] = None
    publishedAt: Optional[datetime] = None


class TranscriptSegment(BaseModel):
    """Audio'da tek bir konuşma satırı (zaman damgalı)."""

    order: int
    speaker: str          # "HOST1" | "HOST2"
    text: str
    startMs: int
    endMs: int
    textTr: Optional[str] = None


class TranslateWordRequest(BaseModel):
    word: str
    contextSentence: Optional[str] = None
    sourceLang: str = "en"
    targetLang: str = "tr"


class TranslateWordResponse(BaseModel):
    word: str
    translation: str
    partOfSpeech: Optional[str] = None
    exampleEn: Optional[str] = None
    exampleTr: Optional[str] = None


class PodcastScriptPhaseResponse(BaseModel):
    """Haber + senaryo + başlık + kaynaklar — ses henüz yok."""

    title: Optional[str] = None
    scriptText: str
    sources: list[NewsSource] = Field(default_factory=list)


class PodcastAudioPhaseResponse(BaseModel):
    """TTS sonrası ses URL'i ve zamanlı transcript."""

    audioUrl: str
    durationSeconds: int
    transcript: list[TranscriptSegment] = Field(default_factory=list)


class GeneratePodcastResponse(BaseModel):
    """Backend'e dönen tam sonuç (tek çağrı uyumluluğu)."""

    title: Optional[str] = None
    scriptText: str
    audioUrl: str
    durationSeconds: int
    sources: list[NewsSource] = Field(default_factory=list)
    transcript: list[TranscriptSegment] = Field(default_factory=list)
