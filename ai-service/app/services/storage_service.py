"""Üretilen mp3'ün kaydedileceği dizin yönetimi ve Firebase Storage yüklemesi."""
from __future__ import annotations

import logging
import threading
from pathlib import Path
from typing import Optional
from uuid import UUID

from ..config import settings

logger = logging.getLogger(__name__)

# Firebase Admin SDK tek seferlik initialize edilir.
_firebase_lock = threading.Lock()
_firebase_initialized = False
_firebase_bucket = None


def ensure_audio_dir() -> Path:
    """Hedef dizin yoksa oluştur, Path döndür."""
    directory = Path(settings.PODCAST_AUDIO_DIR)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def audio_path_for(podcast_id: UUID) -> Path:
    """Bu podcastId için mp3 dosyasının fiziksel yolu (geçici/local)."""
    return ensure_audio_dir() / f"{podcast_id}.mp3"


def local_public_url_for(podcast_id: UUID) -> str:
    """Backend'in static file server'ına göre public URL (fallback)."""
    base = settings.PUBLIC_AUDIO_BASE_URL.rstrip("/")
    return f"{base}/{podcast_id}.mp3"


def _init_firebase():
    """Firebase Admin SDK'yı lazy ve thread-safe şekilde initialize et."""
    global _firebase_initialized, _firebase_bucket

    if _firebase_initialized:
        return _firebase_bucket

    with _firebase_lock:
        if _firebase_initialized:
            return _firebase_bucket

        if not settings.FIREBASE_STORAGE_BUCKET:
            raise RuntimeError(
                "FIREBASE_STORAGE_BUCKET .env'de tanımlı değil."
            )

        cred_path = Path(settings.FIREBASE_CREDENTIALS_PATH)
        if not cred_path.exists():
            raise RuntimeError(
                f"Firebase credentials bulunamadı: {cred_path}"
            )

        import firebase_admin
        from firebase_admin import credentials, storage

        if not firebase_admin._apps:
            cred = credentials.Certificate(str(cred_path))
            firebase_admin.initialize_app(
                cred,
                {"storageBucket": settings.FIREBASE_STORAGE_BUCKET},
            )

        _firebase_bucket = storage.bucket()
        _firebase_initialized = True
        logger.info("Firebase Storage initialized (bucket=%s)", settings.FIREBASE_STORAGE_BUCKET)
        return _firebase_bucket


def upload_to_firebase(local_path: Path, podcast_id: UUID) -> str:
    """Local mp3'ü Firebase Storage'a yükler, public URL döner.

    Yüklenen dosya public-read olarak işaretlenir; URL direkt tarayıcıdan açılabilir.
    """
    bucket = _init_firebase()
    folder = settings.FIREBASE_PODCAST_FOLDER.strip("/")
    blob_name = f"{folder}/{podcast_id}.mp3" if folder else f"{podcast_id}.mp3"

    blob = bucket.blob(blob_name)
    blob.upload_from_filename(str(local_path), content_type="audio/mpeg")
    # MVP için herkese açık: URL'i doğrudan kullanalım.
    blob.make_public()

    logger.info("Uploaded podcast to Firebase: %s", blob.public_url)
    return blob.public_url


def cleanup_local_file(local_path: Path) -> None:
    """Geçici mp3'ü diskten sil. Hata olursa logla ama yutma."""
    try:
        if local_path.exists():
            local_path.unlink()
            logger.info("Local mp3 silindi: %s", local_path)
    except OSError as exc:
        logger.warning("Local mp3 silinemedi (%s): %s", local_path, exc)


def public_url_for(podcast_id: UUID, local_path: Optional[Path] = None) -> str:
    """Konfigürasyona göre Firebase veya local URL döndürür.

    - USE_FIREBASE_STORAGE=true: local dosyayı upload eder, sonra siler, Firebase URL'ini döner.
    - USE_FIREBASE_STORAGE=false: backend'in static file server URL'ini döner (local dosya kalır).
    """
    if settings.USE_FIREBASE_STORAGE:
        if local_path is None:
            local_path = audio_path_for(podcast_id)
        url = upload_to_firebase(local_path, podcast_id)
        cleanup_local_file(local_path)
        return url

    return local_public_url_for(podcast_id)
