from logging import getLogger

from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas import GeneratePodcastRequest, GeneratePodcastResponse
from ..security import verify_internal_secret
from ..services import news_service, script_service, tts_service, storage_service

logger = getLogger(__name__)

router = APIRouter(
    prefix="/internal/podcast",
    tags=["internal-podcast"],
    dependencies=[Depends(verify_internal_secret)],
)


@router.post("/generate", response_model=GeneratePodcastResponse)
async def generate_podcast(payload: GeneratePodcastRequest) -> GeneratePodcastResponse:
    logger.info(
        "Podcast üretim isteği alındı. podcastId=%s categories=%s tone=%s duration=%d speakers=%d",
        payload.podcastId,
        payload.categories,
        payload.tone,
        payload.durationMinutes,
        payload.speakerCount,
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
        )

        audio_path = storage_service.audio_path_for(payload.podcastId)
        duration_seconds, transcript = await tts_service.synthesize_podcast(
            script_text=script,
            speaker_count=payload.speakerCount,
            output_path=audio_path,
            duration_minutes=payload.durationMinutes,
        )

        audio_url = storage_service.public_url_for(payload.podcastId, audio_path)
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
        title=_build_title(payload.categories),
        scriptText=script,
        audioUrl=audio_url,
        durationSeconds=duration_seconds,
        sources=news,
        transcript=transcript,
    )


def _build_title(categories: list[str]) -> str:
    if not categories:
        return "Today's Podcast"
    joined = ", ".join(categories)
    return f"Today's {joined} podcast"
