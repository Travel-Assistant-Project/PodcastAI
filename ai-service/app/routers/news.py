"""NewsAPI'yi izole test etmek için yardımcı endpoint."""

from typing import Optional

from fastapi import APIRouter, Depends, Query

from ..schemas import NewsSource
from ..security import verify_internal_secret
from ..services import news_service

router = APIRouter(
    prefix="/internal/news",
    tags=["internal-news"],
    dependencies=[Depends(verify_internal_secret)],
)


@router.get("/preview", response_model=list[NewsSource])
async def preview(
    categories: str = Query(..., description="Virgülle ayrılmış kategori listesi"),
    language: str = Query("tr"),
    limit: Optional[int] = Query(None, ge=1, le=20),
) -> list[NewsSource]:
    cats = [c.strip() for c in categories.split(",") if c.strip()]
    return await news_service.fetch_headlines(
        categories=cats,
        language=language,
        limit_per_category=limit,
    )
