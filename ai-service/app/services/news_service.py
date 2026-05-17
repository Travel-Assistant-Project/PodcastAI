"""NewsAPI entegrasyonu.

Kullanıcının seçtiği iç kategorileri NewsAPI sorgularına çevirip en güncel
haber başlıklarını toplar.
"""
from __future__ import annotations

from datetime import datetime, timezone
from logging import getLogger
from typing import Any, Optional

import httpx

from ..config import settings
from ..schemas import NewsSource

logger = getLogger(__name__)

NEWS_API_BASE = "https://newsapi.org/v2"

# Bizim iç kategori -> NewsAPI sorgu eşlemesi.
# "type=top" -> /top-headlines?country=<TOP_HEADLINES_COUNTRY>&category=X
# "type=everything" -> /everything?language=<lang>&q=X&sortBy=publishedAt
_CATEGORY_MAP: dict[str, dict[str, str]] = {
    "technology":    {"type": "top", "category": "technology"},
    "sports":        {"type": "top", "category": "sports"},
    "economy":       {"type": "top", "category": "business"},
    "health":        {"type": "top", "category": "health"},
    "science":       {"type": "top", "category": "science"},
    "entertainment": {"type": "top", "category": "entertainment"},
    "world":         {"type": "top", "category": "general"},
    "ai":            {"type": "everything", "query": '"artificial intelligence" OR "machine learning" OR LLM'},
    "finance":       {"type": "everything", "query": "finance OR markets OR stocks OR crypto"},
    "music":         {"type": "everything", "query": "music OR album OR single OR concert"},
}

# NewsAPI top-headlines, "language" parametresini desteklemiyor; ülke koduyla
# ayarlıyoruz. ai-service.language -> NewsAPI country
_LANGUAGE_TO_TOP_COUNTRY: dict[str, str] = {
    "en": "us",
    "tr": "tr",
}


async def fetch_headlines(
    categories: list[str],
    language: str = "en",
    limit_per_category: Optional[int] = None,
) -> list[NewsSource]:
    """Seçilen kategorilere göre NewsAPI'den haber döndürür.

    MOCK_NEWS=true ise gerçek çağrı yapmaz, örnek veri döner.
    """
    limit = limit_per_category or settings.NEWS_PER_CATEGORY

    if settings.MOCK_NEWS:
        return _mock_sources(categories)

    if not settings.NEWS_API_KEY:
        raise RuntimeError("NEWS_API_KEY ayarlanmamış.")

    results: list[NewsSource] = []
    seen_urls: set[str] = set()

    async with httpx.AsyncClient(timeout=20.0) as client:
        for raw in categories:
            key = raw.strip().lower()
            mapping = _CATEGORY_MAP.get(key)
            if mapping is None:
                logger.warning("Bilinmeyen kategori: %s (atlandı)", key)
                continue

            try:
                articles = await _fetch_for_mapping(client, mapping, language, limit)
            except httpx.HTTPError as exc:
                logger.error("NewsAPI çağrısı başarısız (%s): %s", key, exc)
                continue

            for article in articles:
                url = article.get("url")
                if not url or url in seen_urls:
                    continue
                seen_urls.add(url)
                results.append(_to_news_source(article))

    logger.info("NewsAPI: %d kategori için %d haber toplandı", len(categories), len(results))
    return results


async def _fetch_for_mapping(
    client: httpx.AsyncClient,
    mapping: dict[str, str],
    language: str,
    limit: int,
) -> list[dict[str, Any]]:
    headers = {"X-Api-Key": settings.NEWS_API_KEY}

    if mapping["type"] == "top":
        country = _LANGUAGE_TO_TOP_COUNTRY.get(language.lower(), "us")
        resp = await client.get(
            f"{NEWS_API_BASE}/top-headlines",
            params={
                "country": country,
                "category": mapping["category"],
                "pageSize": limit,
            },
            headers=headers,
        )
    else:
        resp = await client.get(
            f"{NEWS_API_BASE}/everything",
            params={
                "q": mapping["query"],
                "language": language,
                "sortBy": "publishedAt",
                "pageSize": limit,
            },
            headers=headers,
        )

    resp.raise_for_status()
    payload = resp.json()
    if payload.get("status") != "ok":
        logger.warning("NewsAPI non-ok cevabı: %s", payload)
        return []
    return payload.get("articles", []) or []


def _to_news_source(article: dict[str, Any]) -> NewsSource:
    source = article.get("source") or {}
    published_raw = article.get("publishedAt")
    published_at = _parse_dt(published_raw)
    return NewsSource(
        sourceName=source.get("name"),
        newsTitle=article.get("title"),
        newsUrl=article.get("url"),
        publishedAt=published_at,
    )


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        # NewsAPI ISO8601 "Z" suffix ile döner.
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _mock_sources(categories: list[str]) -> list[NewsSource]:
    now = datetime.now(timezone.utc)
    return [
        NewsSource(
            sourceName="mock-source",
            newsTitle=f"[{cat}] Mock haber başlığı",
            newsUrl=f"https://example.com/mock/{cat}",
            publishedAt=now,
        )
        for cat in categories
    ]
