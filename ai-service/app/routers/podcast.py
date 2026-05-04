from logging import getLogger

from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas import GeneratePodcastRequest, GeneratePodcastResponse
from ..security import verify_internal_secret
from ..services import (
    news_service,
    script_service,
    storage_service,
    title_service,
    translation_service,
    tts_service,
)

logger = getLogger(__name__)

router = APIRouter(
    prefix="/internal/podcast",
    tags=["internal-podcast"],
    dependencies=[Depends(verify_internal_secret)],
)


@router.post("/generate", response_model=GeneratePodcastResponse)
async def generate_podcast(payload: GeneratePodcastRequest) -> GeneratePodcastResponse:
    logger.info(
        "Podcast üretim isteği alındı. podcastId=%s categories=%s tone=%s duration=%d speakers=%d learning=%s cefr=%s",
        payload.podcastId,
        payload.categories,
        payload.tone,
        payload.durationMinutes,
        payload.speakerCount,
        payload.learningMode,
        payload.cefrLevel,
    )

    try:
        news = await news_service.fetch_headlines(
            categories=payload.categories,
            language=payload.language,
        )

        script = await script_service.generate_dialog_script(
            news=news,
            tone=payload.tone,
            duration_minutes=payload.durationMinutes,
            speaker_count=payload.speakerCount,
            language=payload.language,
            cefr_level=payload.cefrLevel if payload.learningMode else None,
        )

        audio_path = storage_service.audio_path_for(payload.podcastId)
        duration_seconds, transcript = await tts_service.synthesize_podcast(
            script_text=script,
            speaker_count=payload.speakerCount,
            output_path=audio_path,
            duration_minutes=payload.durationMinutes,
        )

        # Öğrenme modunda transcript'in her satırı Türkçeye çevrilip textTr alanına yazılır.
        if payload.learningMode and transcript:
            try:
                transcript = await translation_service.translate_segments(
                    transcript,
                    target_lang="tr",
                    source_lang=payload.language,
                )
            except Exception as exc:
                # Çeviri başarısız olsa bile podcast'i bozmayalım; textTr boş kalır.
                logger.warning("Transcript çevirisi başarısız, textTr olmadan devam: %s", exc)

        audio_url = storage_service.public_url_for(payload.podcastId, audio_path)

        title_llm = await title_service.generate_episode_title(
            news=news,
            categories=payload.categories,
            tone=payload.tone,
            language=payload.language,
            script_preview=script[:1200] if script else "",
        )
        episode_title = title_llm or title_service.fallback_title(payload.categories, news)
    except NotImplementedError as exc:
        logger.error("Pipeline bileşeni hazır değil: %s", exc)
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Podcast üretimi başarısız.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Podcast üretimi başarısız: {exc}",
        )

    return GeneratePodcastResponse(
        title=episode_title,
        scriptText=script,
        audioUrl=audio_url,
        durationSeconds=duration_seconds,
        sources=news,
        transcript=transcript,
    )
