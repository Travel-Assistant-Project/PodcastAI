"""ElevenLabs TTS ile script'ten mp3 üretir ve birleştirir."""
from __future__ import annotations

import asyncio
import io
import re
from logging import getLogger
from pathlib import Path
from typing import List, Optional

import httpx
from pydub import AudioSegment

from ..config import settings
from ..schemas import TranscriptSegment

logger = getLogger(__name__)

ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"

# Satırları [HOST1]: ... veya [HOST2]: ... formatından ayırıyoruz.
_LINE_PATTERN = re.compile(r"^\s*\[HOST(\d+)\]\s*:\s*(.+)$", re.IGNORECASE)

# Her replika arasında 350 ms sessizlik (doğal ritim için).
_SILENCE_MS = 350

# Aynı anda en fazla kaç TTS çağrısı yapılsın.
# ElevenLabs free tier: max 2 concurrent. Paid planlara göre artırılabilir.
_TTS_CONCURRENCY = 2

# 429 (rate limit) durumunda kaç kez ve ne kadar bekleyerek tekrar denenecek.
_TTS_RETRIES = 4
_TTS_BACKOFF_BASE = 1.5  # saniye, üstel artar


async def synthesize_podcast(
    script_text: str,
    speaker_count: int,
    output_path: Path,
    duration_minutes: int,
) -> tuple[int, list[TranscriptSegment]]:
    """mp3'ü diske yazar, (duration_seconds, transcript) döndürür.

    transcript: her satırın audio içindeki kesin başlangıç/bitiş ms'i.
    Frontend `audio.currentTime * 1000` ile karşılaştırarak aktif satırı vurgulayabilir.
    """
    if settings.MOCK_TTS:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(b"")
        logger.info("MOCK_TTS=true -> boş mp3 yazıldı: %s", output_path)
        transcript = _mock_transcript(script_text, speaker_count, duration_minutes)
        return duration_minutes * 60, transcript

    if not settings.ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY ayarlanmamış.")

    parsed = _parse_script(script_text, speaker_count)
    if not parsed:
        raise RuntimeError("Script parse edilemedi, konuşma satırı bulunamadı.")

    logger.info(
        "ElevenLabs TTS: %d satır, model=%s",
        len(parsed), settings.ELEVENLABS_MODEL,
    )

    audio_bytes_list = await _synthesize_all([(voice, text) for voice, _, text in parsed])

    combined = AudioSegment.silent(duration=0)
    silence = AudioSegment.silent(duration=_SILENCE_MS)
    transcript: list[TranscriptSegment] = []

    for idx, raw in enumerate(audio_bytes_list):
        try:
            seg = AudioSegment.from_file(io.BytesIO(raw), format="mp3")
        except Exception as exc:
            raise RuntimeError(f"TTS cevabı mp3 olarak decode edilemedi (satır {idx}): {exc}")

        start_ms = len(combined)
        combined += seg
        end_ms = len(combined)

        _, host_label, text = parsed[idx]
        transcript.append(TranscriptSegment(
            order=idx,
            speaker=host_label,
            text=text,
            startMs=start_ms,
            endMs=end_ms,
        ))

        if idx < len(audio_bytes_list) - 1:
            combined += silence

    output_path.parent.mkdir(parents=True, exist_ok=True)
    combined.export(output_path, format="mp3", bitrate="128k")

    duration_seconds = int(round(len(combined) / 1000))
    logger.info(
        "Podcast mp3 hazır: %s (%d sn, %d transcript satırı)",
        output_path, duration_seconds, len(transcript),
    )
    return duration_seconds, transcript


def _parse_script(script_text: str, speaker_count: int) -> list[tuple[str, str, str]]:
    """Script'i (voice_id, host_label, text) üçlülerine çevirir.

    host_label TTS yönlendirmesinden bağımsız olarak orijinal etiketi (HOST1/HOST2)
    korur; transcript bu sayede tek sunucu modunda bile doğru speaker bilgisini taşır.
    """
    voice_map = {
        "1": settings.ELEVENLABS_VOICE_HOST1,
        "2": settings.ELEVENLABS_VOICE_HOST2,
    }
    # Tek sunucu ise tüm satırları HOST1 sesine yönlendir (label HOST1 kalır).
    if speaker_count < 2:
        voice_map["2"] = settings.ELEVENLABS_VOICE_HOST1

    segments: list[tuple[str, str, str]] = []
    current_voice: str = settings.ELEVENLABS_VOICE_HOST1
    current_label: str = "HOST1"
    current_buffer: list[str] = []

    def flush():
        if current_buffer:
            text = " ".join(current_buffer).strip()
            if text:
                segments.append((current_voice, current_label, text))

    for line in script_text.splitlines():
        match = _LINE_PATTERN.match(line)
        if match:
            flush()
            current_buffer = []
            host_num = match.group(1)
            current_voice = voice_map.get(host_num, settings.ELEVENLABS_VOICE_HOST1)
            current_label = f"HOST{host_num}" if speaker_count >= 2 else "HOST1"
            current_buffer.append(match.group(2).strip())
        else:
            stripped = line.strip()
            if stripped:
                current_buffer.append(stripped)

    flush()
    return segments


async def _synthesize_all(segments: list[tuple[str, str]]) -> list[bytes]:
    """Satırları paralel (sınırlı eşzamanlılık) TTS'le."""
    semaphore = asyncio.Semaphore(_TTS_CONCURRENCY)
    results: List[Optional[bytes]] = [None] * len(segments)

    async with httpx.AsyncClient(timeout=120.0) as client:
        async def worker(i: int, voice_id: str, text: str) -> None:
            async with semaphore:
                results[i] = await _tts_one(client, voice_id, text)

        await asyncio.gather(
            *[worker(i, v, t) for i, (v, t) in enumerate(segments)]
        )

    return [r for r in results if r is not None]


def _mock_transcript(
    script_text: str, speaker_count: int, duration_minutes: int,
) -> list[TranscriptSegment]:
    """MOCK_TTS modunda gerçek audio yok; satırları süreye eşit dağıtarak sahte zamanlama üretiriz."""
    parsed = _parse_script(script_text, speaker_count)
    if not parsed:
        return []
    total_ms = duration_minutes * 60 * 1000
    per = total_ms // len(parsed)
    out: list[TranscriptSegment] = []
    for i, (_, label, text) in enumerate(parsed):
        out.append(TranscriptSegment(
            order=i,
            speaker=label,
            text=text,
            startMs=i * per,
            endMs=(i + 1) * per if i < len(parsed) - 1 else total_ms,
        ))
    return out


async def _tts_one(client: httpx.AsyncClient, voice_id: str, text: str) -> bytes:
    url = f"{ELEVENLABS_BASE}/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": settings.ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.4,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    last_error: Optional[str] = None
    for attempt in range(_TTS_RETRIES):
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code == 200:
            return resp.content

        # 429 / 5xx -> tekrar dene.
        if resp.status_code in (429, 500, 502, 503, 504):
            last_error = f"{resp.status_code}: {resp.text[:200]}"
            wait = _TTS_BACKOFF_BASE * (2 ** attempt)
            logger.warning(
                "ElevenLabs %s (deneme %d/%d). %.1f sn bekleniyor...",
                resp.status_code, attempt + 1, _TTS_RETRIES, wait,
            )
            await asyncio.sleep(wait)
            continue

        # Diğer hatalar (401, 400, vb) retry etmek anlamsız.
        logger.error("ElevenLabs %s -> %s", resp.status_code, resp.text[:300])
        raise RuntimeError(f"ElevenLabs hata ({resp.status_code}): {resp.text[:200]}")

    raise RuntimeError(f"ElevenLabs rate-limit sonrası başarısız: {last_error}")
