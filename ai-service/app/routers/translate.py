"""Backend'in tek-kelime / kısa-ifade çevirisi için kullandığı iç endpoint.

Backend bu uç noktayı sadece cache'i miss ettiğinde çağırır; AI servisi
stateless çalışır, sonucu kendisi saklamaz.
"""
from logging import getLogger

from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas import TranslateWordRequest, TranslateWordResponse
from ..security import verify_internal_secret
from ..services import translation_service

logger = getLogger(__name__)

router = APIRouter(
    prefix="/internal/translate",
    tags=["internal-translate"],
    dependencies=[Depends(verify_internal_secret)],
)


@router.post("/word", response_model=TranslateWordResponse)
async def translate_word(payload: TranslateWordRequest) -> TranslateWordResponse:
    logger.info(
        "Kelime çevirisi: word=%r ctx=%s %s->%s",
        payload.word,
        bool(payload.contextSentence),
        payload.sourceLang,
        payload.targetLang,
    )
    try:
        return await translation_service.translate_word(
            word=payload.word,
            context_sentence=payload.contextSentence,
            source_lang=payload.sourceLang,
            target_lang=payload.targetLang,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Kelime çevirisi başarısız.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Çeviri başarısız: {exc}",
        )
