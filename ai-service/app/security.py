import secrets

from fastapi import Header, HTTPException, status

from .config import settings


async def verify_internal_secret(
    x_internal_secret: str | None = Header(default=None, alias="X-Internal-Secret"),
) -> None:
    """Backend <-> ai-service arasındaki shared secret kontrolü.

    .env'de AI_SERVICE_SECRET boşsa kontrolü atlamıyoruz — hata veriyoruz ki
    production'a yanlışlıkla açık bir servis çıkmasın.
    """
    expected = settings.AI_SERVICE_SECRET
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI_SERVICE_SECRET yapılandırılmamış.",
        )
    if not x_internal_secret or not secrets.compare_digest(x_internal_secret, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya eksik X-Internal-Secret.",
        )
