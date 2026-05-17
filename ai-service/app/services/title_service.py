"""OpenRouter ile bölüm başlığı üretir; API yoksa veya hata olursa None döner."""
from __future__ import annotations

import re
from logging import getLogger
from typing import Optional

import httpx

from ..config import settings
from ..schemas import NewsSource
from .script_service import _LANGUAGE_NAMES, _TONE_GUIDELINES

logger = getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def fallback_title(categories: list[str], news: list[NewsSource]) -> str:
    """API kullanılamadığında: önce haber başlığı, yoksa kategori türevi."""
    for item in news:
        raw = (item.newsTitle or "").strip()
        if raw and raw.lower() not in ("untitled", "untitled story"):
            words = raw.split()
            if len(words) > 12:
                raw = " ".join(words[:12]) + "…"
            elif len(raw) > 72:
                cut = raw[:69].rsplit(" ", 1)[0]
                raw = cut + "…" if cut else raw[:69] + "…"
            return raw

    if not categories:
        return "Daily briefing"

    pretty = [_pretty_category(c) for c in categories[:2]]
    if len(pretty) == 1:
        return f"{pretty[0]}: stories that matter"
    return f"{pretty[0]} & {pretty[1]}: what changed"


def _pretty_category(cat: str) -> str:
    c = cat.strip().replace("-", " ").replace("_", " ")
    if not c:
        return "News"
    return c.title()


async def generate_episode_title(
    *,
    news: list[NewsSource],
    categories: list[str],
    tone: str,
    language: str,
    script_preview: str,
) -> Optional[str]:
    if not settings.OPENROUTER_API_KEY:
        return None

    lang_name = _LANGUAGE_NAMES.get(language.lower(), "English")
    tone_hint = _TONE_GUIDELINES.get(tone.lower(), _TONE_GUIDELINES["casual"])
    headlines = _format_headlines(news[:8])
    cats = ", ".join(categories) if categories else "general news"
    preview = (script_preview or "").strip()
    if len(preview) > 600:
        preview = preview[:600] + "…"

    system = (
        f"You write short podcast episode titles in {lang_name}. "
        "Reply with ONLY the title text: no quotes, no numbering, no emoji, no markdown."
    )
    user = (
        f"Language: {lang_name} (title must be entirely in this language).\n"
        f"Show tone (for vibe only): {tone_hint}\n"
        f"Topic tags: {cats}\n\n"
        "News angles to reflect (do not copy a headline verbatim; synthesize the main story):\n"
        f"{headlines}\n\n"
        "First lines of the episode script (context only, do not quote labels like [HOST1]):\n"
        f"{preview if preview else '(no preview)'}\n\n"
        "Requirements:\n"
        "- 5–12 words, specific and intriguing (NPR / quality news-magazine style, not clickbait).\n"
        '- Do NOT start with "Today\'s", "This week", "Daily", or "Episode".\n'
        '- Avoid ending with the word "Podcast" unless it reads awkward without it.\n'
        "- Do NOT invent facts, companies, or numbers that are not implied above.\n"
        "- Single line only."
    )

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.85,
        "max_tokens": 64,
    }
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "AI Podcast Platform",
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        if resp.status_code != 200:
            logger.warning("Title OpenRouter %s -> %s", resp.status_code, resp.text[:200])
            return None
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        title = _sanitize_title(content)
        if len(title) < 4:
            return None
        return title[:120]
    except Exception as exc:
        logger.warning("Episode title generation failed: %s", exc)
        return None


def _format_headlines(news: list[NewsSource]) -> str:
    lines: list[str] = []
    for i, n in enumerate(news, start=1):
        t = (n.newsTitle or "").strip() or "(no title)"
        src = n.sourceName or "source"
        lines.append(f"{i}. [{src}] {t}")
    return "\n".join(lines) if lines else "(no headlines)"


def _sanitize_title(raw: str) -> str:
    s = raw.strip()
    s = re.sub(r"^[\"'«»“”]+|[\"'«»“”]+$", "", s)
    s = re.sub(r"\s+", " ", s)
    s = s.split("\n")[0].strip()
    return s
