from logging import getLogger

from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas import (
    GeneratePodcastRequest,
    GeneratePodcastResponse,
    PodcastAudioPhaseRequest,
    PodcastAudioPhaseResponse,
    PodcastScriptPhaseResponse,
)
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


async def _run_script_phase(payload: GeneratePodcastRequest) -> PodcastScriptPhaseResponse:
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

    title_llm = await title_service.generate_episode_title(
        news=news,
        categories=payload.categories,
        tone=payload.tone,
        language=payload.language,
        script_preview=script[:1200] if script else "",
    )
    episode_title = title_llm or title_service.fallback_title(payload.categories, news)

    return PodcastScriptPhaseResponse(
        title=episode_title,
        scriptText=script,
        sources=news,
    )


async def _run_audio_phase(payload: PodcastAudioPhaseRequest) -> PodcastAudioPhaseResponse:
    audio_path = storage_service.audio_path_for(payload.podcastId)
    duration_seconds, transcript = await tts_service.synthesize_podcast(
        script_text=payload.scriptText,
        speaker_count=payload.speakerCount,
        output_path=audio_path,
        duration_minutes=payload.durationMinutes,
    )

    if payload.learningMode and transcript:
        try:
            transcript = await translation_service.translate_segments(
                transcript,
                target_lang="tr",
                source_lang=payload.language,
            )
        except Exception as exc:
            logger.warning(
                "Transcript çevirisi başarısız, textTr olmadan devam: %s",
                exc,
            )

    audio_url = storage_service.public_url_for(payload.podcastId, audio_path)

    return PodcastAudioPhaseResponse(
        audioUrl=audio_url,
        durationSeconds=duration_seconds,
        transcript=transcript,
    )


def _podcast_pipeline_http_detail(exc: Exception) -> HTTPException:
    if isinstance(exc, NotImplementedError):
        logger.error("Pipeline bileşeni hazır değil: %s", exc)
        return HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc))
    logger.exception("Podcast üretimi başarısız.")
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Podcast üretimi başarısız: {exc}",
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
        script_phase = await _run_script_phase(payload)
        audio_phase = await _run_audio_phase(
            PodcastAudioPhaseRequest(
                podcastId=payload.podcastId,
                scriptText=script_phase.scriptText,
                speakerCount=payload.speakerCount,
                durationMinutes=payload.durationMinutes,
                language=payload.language,
                learningMode=payload.learningMode,
                cefrLevel=payload.cefrLevel,
            ),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _podcast_pipeline_http_detail(exc) from exc

    return GeneratePodcastResponse(
        title=script_phase.title,
        scriptText=script_phase.scriptText,
        audioUrl=audio_phase.audioUrl,
        durationSeconds=audio_phase.durationSeconds,
        sources=script_phase.sources,
        transcript=audio_phase.transcript,
    )


@router.post("/script-phase", response_model=PodcastScriptPhaseResponse)
async def podcast_script_phase(payload: GeneratePodcastRequest) -> PodcastScriptPhaseResponse:
    logger.info(
        "Podcast script fazı. podcastId=%s categories=%s",
        payload.podcastId,
        payload.categories,
    )
    try:
        return await _run_script_phase(payload)
    except HTTPException:
        raise
    except Exception as exc:
        raise _podcast_pipeline_http_detail(exc) from exc


@router.post("/audio-phase", response_model=PodcastAudioPhaseResponse)
async def podcast_audio_phase(payload: PodcastAudioPhaseRequest) -> PodcastAudioPhaseResponse:
    logger.info("Podcast audio fazı. podcastId=%s", payload.podcastId)
    try:
        return await _run_audio_phase(payload)
    except HTTPException:
        raise
    except Exception as exc:
        raise _podcast_pipeline_http_detail(exc) from exc
