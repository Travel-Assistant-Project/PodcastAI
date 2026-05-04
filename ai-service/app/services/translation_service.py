"""Transcript ve kelime çevirisi (LLM tabanlı, OpenRouter üzerinden).

İki açık API:
- translate_segments(segments, target_lang): toplu (N satır → 1 LLM çağrısı) ile
  her TranscriptSegment'e textTr alanı doldurulur.
- translate_word(word, context, source_lang, target_lang): tek kelime + bağlam
  için sözlük çıktısı (kısa Türkçe karşılık + part-of-speech + örnek).
"""
from __future__ import annotations

import json
import re
from logging import getLogger

import httpx

from ..config import settings
from ..schemas import TranscriptSegment, TranslateWordResponse

logger = getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

_LANG_NAMES = {
    "en": "English",
    "tr": "Turkish",
}

_DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost",
    "X-Title": "AI Podcast Platform",
}


# ----------------------------------------------------------------------------
# Public API
# ----------------------------------------------------------------------------

async def translate_segments(
    segments: list[TranscriptSegment],
    target_lang: str = "tr",
    source_lang: str = "en",
) -> list[TranscriptSegment]:
    """Verilen TranscriptSegment listesini target_lang'a çevirir; textTr doldurulur.

    Mock modda her satıra "[TR] {text}" yazılır.
    """
    if not segments:
        return segments

    if settings.MOCK_SCRIPT:
        return _mock_translate_segments(segments, target_lang)

    if not settings.OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY ayarlanmamış.")

    src_name = _LANG_NAMES.get(source_lang.lower(), source_lang)
    tgt_name = _LANG_NAMES.get(target_lang.lower(), target_lang)

    # Numbered JSON in / numbered JSON out: sırayı korumak için index'e dayanıyoruz.
    payload_lines = [{"i": idx, "text": seg.text} for idx, seg in enumerate(segments)]

    system = (
        f"You are a professional {src_name}-to-{tgt_name} translator for podcast subtitles. "
        f"Translate each input line to natural, fluent {tgt_name}. "
        "Keep meaning faithful. Preserve numbers, names, brands as-is. "
        "Return STRICT JSON only (no markdown, no commentary) in this exact shape:\n"
        '{"items": [{"i": 0, "textTr": "<translation>"}, {"i": 1, "textTr": "<translation>"}]}\n'
        "Always include the SAME number of items as the input, in the SAME order, "
        'using the keys "i" (the integer index) and "textTr" (the translation string).'
    )
    user = (
        f"Translate the following {src_name} podcast lines to {tgt_name}.\n\n"
        f"INPUT:\n{json.dumps(payload_lines, ensure_ascii=False)}\n\n"
        'Respond ONLY with: {"items": [...]}.'
    )

    body = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }

    headers = {
        **_DEFAULT_HEADERS,
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
    }

    logger.info("Transcript çevirisi başlıyor. lines=%d %s->%s", len(segments), source_lang, target_lang)

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(OPENROUTER_URL, json=body, headers=headers)

    if resp.status_code != 200:
        logger.error("OpenRouter translate %s -> %s", resp.status_code, resp.text[:300])
        raise RuntimeError(f"OpenRouter çeviri hatası ({resp.status_code}).")

    content = resp.json()["choices"][0]["message"]["content"]
    items = _parse_translation_array(content)

    # Önce indeksli eşleştirmeyi dene; LLM "i" anahtarını göz ardı ettiyse positional eşleştir.
    by_index: dict[int, str] = {}
    positional: list[str | None] = []

    for item in items:
        if not isinstance(item, dict):
            positional.append(None)
            continue
        # Çeviri metni çeşitli isimlerde gelebilir.
        tr_value = (
            item.get("textTr")
            or item.get("translation")
            or item.get("tr")
            or item.get("text")
            or item.get("target")
            or ""
        )
        tr_str = str(tr_value).strip()

        positional.append(tr_str or None)

        # Index alanı varsa kullan.
        idx_value = item.get("i")
        if idx_value is None:
            idx_value = item.get("index")
        if idx_value is None:
            idx_value = item.get("id")
        try:
            idx = int(idx_value) if idx_value is not None else None
        except (TypeError, ValueError):
            idx = None
        if idx is not None and tr_str:
            by_index[idx] = tr_str

    out: list[TranscriptSegment] = []
    for pos, seg in enumerate(segments):
        text_tr = by_index.get(pos)
        if not text_tr and pos < len(positional):
            text_tr = positional[pos]
        out.append(seg.model_copy(update={"textTr": text_tr}))

    matched = sum(1 for s in out if s.textTr)
    logger.info(
        "Transcript çevirisi tamamlandı: %d/%d satır eşleşti.", matched, len(segments)
    )
    if matched == 0:
        # Debug için ham yanıtın bir kısmını göster — yine de hata fırlatma.
        logger.warning(
            "Çeviri 0 satır döndü. raw_content_head=%s", str(content)[:300]
        )
    return out


async def translate_word(
    word: str,
    context_sentence: str | None = None,
    source_lang: str = "en",
    target_lang: str = "tr",
) -> TranslateWordResponse:
    """Tek kelime / kısa ifade için bağlama duyarlı sözlük çıktısı."""
    word_clean = (word or "").strip()
    if not word_clean:
        raise ValueError("word boş olamaz.")

    if settings.MOCK_SCRIPT:
        return TranslateWordResponse(
            word=word_clean,
            translation=f"[{target_lang.upper()}] {word_clean}",
            partOfSpeech="noun",
            exampleEn=context_sentence or f"This is the word '{word_clean}'.",
            exampleTr=f"[{target_lang.upper()}] örnek cümle.",
        )

    if not settings.OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY ayarlanmamış.")

    src_name = _LANG_NAMES.get(source_lang.lower(), source_lang)
    tgt_name = _LANG_NAMES.get(target_lang.lower(), target_lang)

    system = (
        f"You are a {src_name}-{tgt_name} bilingual dictionary. "
        "Given a single word or short phrase (and optionally the sentence it appears in), "
        f"return a concise translation in {tgt_name} that fits the context. "
        "Output STRICT JSON only, with this exact shape: "
        '{"translation": "...", "partOfSpeech": "noun|verb|adjective|adverb|phrase|...", '
        '"exampleEn": "...", "exampleTr": "..."}. '
        "No markdown, no explanation."
    )
    if context_sentence:
        user = (
            f'Word: "{word_clean}"\n'
            f'Sentence: "{context_sentence}"\n'
            f"Return the {tgt_name} translation that fits this sentence."
        )
    else:
        user = (
            f'Word: "{word_clean}"\n'
            f"Return the most common {tgt_name} translation."
        )

    body = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }
    headers = {
        **_DEFAULT_HEADERS,
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(OPENROUTER_URL, json=body, headers=headers)

    if resp.status_code != 200:
        logger.error("OpenRouter word-translate %s -> %s", resp.status_code, resp.text[:300])
        raise RuntimeError(f"OpenRouter kelime çeviri hatası ({resp.status_code}).")

    raw = resp.json()["choices"][0]["message"]["content"]
    data = _safe_parse_json_object(raw)

    return TranslateWordResponse(
        word=word_clean,
        translation=str(data.get("translation") or "").strip() or word_clean,
        partOfSpeech=(str(data["partOfSpeech"]).strip() if data.get("partOfSpeech") else None),
        exampleEn=(str(data["exampleEn"]).strip() if data.get("exampleEn") else None),
        exampleTr=(str(data["exampleTr"]).strip() if data.get("exampleTr") else None),
    )


# ----------------------------------------------------------------------------
# Internals
# ----------------------------------------------------------------------------

def _mock_translate_segments(
    segments: list[TranscriptSegment], target_lang: str
) -> list[TranscriptSegment]:
    tag = f"[{target_lang.upper()}]"
    return [
        seg.model_copy(update={"textTr": f"{tag} {seg.text}"})
        for seg in segments
    ]


def _parse_translation_array(content: str) -> list[dict]:
    """LLM cevabından çeviri listesini güvenli biçimde çıkar.

    Bazı modeller `{"items": [...]}` veya doğrudan `[...]` döndürür; ikisini de destekliyoruz.
    """
    text = content.strip()
    # Bazı modeller markdown code-fence ekliyor.
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        if text.endswith("```"):
            text = text[:-3].strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # İmdat: ilk JSON array'i regex ile bulmayı dene.
        match = re.search(r"\[\s*\{.*?\}\s*\]", text, re.DOTALL)
        if not match:
            logger.error("Çeviri JSON parse edilemedi: %s", text[:200])
            return []
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError:
            return []

    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("items", "translations", "data", "result"):
            if key in data and isinstance(data[key], list):
                return data[key]
    return []


def _safe_parse_json_object(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        if text.endswith("```"):
            text = text[:-3].strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return {}
        try:
            data = json.loads(match.group(0))
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            return {}
