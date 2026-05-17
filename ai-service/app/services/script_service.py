"""OpenRouter üzerinden LLM ile diyalog / monolog podcast scripti üretir."""
from __future__ import annotations

from logging import getLogger
from typing import Optional

import httpx

from ..config import settings
from ..schemas import NewsSource

logger = getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# İngilizce konuşma hızı ~150 wpm kabul edilerek hedef kelime sayısı.
_WORDS_PER_MINUTE = 150

# Tonlar İngilizce kılavuz metinleri; LLM doğrudan uygulasın diye İngilizce.
_TONE_GUIDELINES = {
    "formal": "Formal news-bulletin style; avoid slang, use complete sentences and an authoritative voice.",
    "casual": "Friendly, everyday conversational tone; natural, smooth, and easy to listen to.",
    "fun":    "Playful and energetic tone; light humor and witty banter are welcome.",
}

# language kodu -> insan-okur dil adı
_LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "tr": "Turkish",
}

_CEFR_GUIDELINES: dict[str, str] = {
    "A1": (
        "CEFR A1 (Beginner): Use ONLY the ~500 most common English words. "
        "Very short sentences (max 8 words). Present simple tense. "
        "No idioms, no phrasal verbs, no slang. Repeat key vocabulary."
    ),
    "A2": (
        "CEFR A2 (Elementary): Common everyday vocabulary. "
        "Short, simple sentences (max 12 words). Mostly present and past simple. "
        "Avoid idioms; explain any uncommon word in context."
    ),
    "B1": (
        "CEFR B1 (Intermediate): Intermediate vocabulary. Clear sentences (max 18 words). "
        "Phrasal verbs are fine but used in clear context. Limited idiomatic language."
    ),
    "B2": (
        "CEFR B2 (Upper-intermediate): Natural pace. Idioms allowed but not slang. "
        "Complex sentences are fine, but keep them readable."
    ),
    "C1": "CEFR C1 (Advanced): Nuanced vocabulary, varied syntax, idioms welcome.",
    "C2": "CEFR C2 (Proficient): Native-like; full register flexibility.",
}


async def generate_dialog_script(
    news: list[NewsSource],
    tone: str,
    duration_minutes: int,
    speaker_count: int,
    language: str = "en",
    cefr_level: Optional[str] = None,
) -> str:
    if settings.MOCK_SCRIPT:
        return _mock_script(news, tone, duration_minutes, speaker_count, language)

    if not settings.OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY ayarlanmamış.")

    system_prompt = _build_system_prompt(
        tone, duration_minutes, speaker_count, language, cefr_level
    )
    user_prompt = _build_user_prompt(news, duration_minutes, language)
    target_words = duration_minutes * _WORDS_PER_MINUTE
    # ~1.3 token / EN kelime + biraz marj
    max_tokens = min(4000, target_words * 2 + 200)

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens": max_tokens,
    }

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        # OpenRouter leaderboard / analytics için opsiyonel:
        "HTTP-Referer": "http://localhost",
        "X-Title": "AI Podcast Platform",
    }

    logger.info(
        "OpenRouter çağrısı. model=%s duration=%d speakers=%d target_words=%d",
        settings.OPENROUTER_MODEL, duration_minutes, speaker_count, target_words,
    )

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)

    if resp.status_code != 200:
        logger.error("OpenRouter %s -> %s", resp.status_code, resp.text)
        raise RuntimeError(f"OpenRouter hata ({resp.status_code}): {resp.text}")

    data = resp.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        logger.error("OpenRouter beklenmeyen cevap: %s", data)
        raise RuntimeError("OpenRouter cevabı beklenen formatta değil.") from exc

    return content.strip()


def _build_system_prompt(
    tone: str,
    duration_minutes: int,
    speaker_count: int,
    language: str,
    cefr_level: Optional[str] = None,
) -> str:
    tone_rule = _TONE_GUIDELINES.get(tone.lower(), _TONE_GUIDELINES["casual"])
    target_words = duration_minutes * _WORDS_PER_MINUTE
    lang_name = _LANGUAGE_NAMES.get(language.lower(), "English")

    if speaker_count >= 2:
        speaker_rule = (
            f"Write a two-host {lang_name} podcast as a DIALOGUE. "
            "Every line MUST start with [HOST1]: or [HOST2]:. "
            "Both hosts should speak in balance, ask each other questions, react and add commentary."
        )
    else:
        speaker_rule = (
            f"Write a single-host {lang_name} podcast as a MONOLOGUE. "
            "Every line MUST start with [HOST1]:."
        )

    cefr_rule = ""
    if cefr_level:
        guideline = _CEFR_GUIDELINES.get(cefr_level.upper())
        if guideline:
            cefr_rule = (
                f"\nLanguage level: {guideline} "
                "The script will be used for English language learning, "
                "so vocabulary and sentence complexity MUST stay within this level."
            )

    return (
        f"You are a professional {lang_name} podcast scriptwriter.\n"
        f"{speaker_rule}\n"
        f"Tone: {tone_rule}\n"
        f"Target length: {duration_minutes} minutes (~{target_words} words).\n"
        f"The entire script MUST be written in {lang_name}."
        f"{cefr_rule}\n"
        "Rules:\n"
        "- Output ONLY the script text; no intro, no title, no markdown, no emoji.\n"
        "- Comment on the supplied news items; do NOT invent facts, numbers, or sources.\n"
        "- Include a smooth opening, a main section that covers the news, and a brief closing.\n"
        "- Mention source names naturally in conversation (e.g. \"according to Reuters...\")."
    )


def _build_user_prompt(news: list[NewsSource], duration_minutes: int, language: str) -> str:
    items = news[:12]
    lang_name = _LANGUAGE_NAMES.get(language.lower(), "English")

    if not items:
        return (
            f"Write a {duration_minutes}-minute general-news podcast in {lang_name}. "
            "No news data was supplied; produce a general overview of recent current events."
        )

    lines = [
        f"Prepare a {duration_minutes}-minute podcast in {lang_name}. "
        "Use the following news items:"
    ]
    for i, n in enumerate(items, start=1):
        title = n.newsTitle or "Untitled"
        source = n.sourceName or "unknown source"
        lines.append(f"{i}. [{source}] {title}")
    lines.append("\nOutput only the script in the required format.")
    return "\n".join(lines)


def _mock_script(
    news: list[NewsSource],
    tone: str,
    duration_minutes: int,
    speaker_count: int,
    language: str = "en",
) -> str:
    lines = [
        "[HOST1]: Hello and welcome to today's episode!",
        f"[HOST2]: Today we have a {duration_minutes}-minute {tone}-toned show for you.",
    ]
    for i, item in enumerate(news[:5], start=1):
        host = "[HOST1]" if i % 2 else "[HOST2]"
        title = item.newsTitle or "Untitled story"
        src = item.sourceName or "an unnamed source"
        lines.append(f"{host}: According to {src}: {title}")
    lines.append("[HOST1]: (This is a mock script — real dialogue is generated in step 7.)")
    return "\n".join(lines)
