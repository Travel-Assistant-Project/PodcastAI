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


class GeneratePodcastResponse(BaseModel):
    """Backend'e dönen sonuç."""

    title: Optional[str] = None
    scriptText: str
    audioUrl: str
    durationSeconds: int
    sources: list[NewsSource] = Field(default_factory=list)
    transcript: list[TranscriptSegment] = Field(default_factory=list)
