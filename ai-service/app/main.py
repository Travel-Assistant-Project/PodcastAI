import logging

from fastapi import FastAPI

from .routers import news as news_router
from .routers import podcast as podcast_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")

app = FastAPI(
    title="AI Podcast Service",
    version="0.1.0",
    description="NewsAPI -> OpenRouter -> ElevenLabs podcast boru hattı.",
)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"service": "ai-service", "status": "ok"}


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(podcast_router.router)
app.include_router(news_router.router)
