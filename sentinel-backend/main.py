import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

# Allow running the app from the project root as well as the backend folder.
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from analytics_service import (
    get_analytics_summary,
    get_recent_messages,
    store_message_record_with_sentiment,
)
from connection_manager import manager
from database import mongodb
from models import MessageCreate
from utils import analyze_sentiment


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


def get_allowed_origins() -> list[str]:
    configured = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if configured.strip():
        origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
        if "*" in origins:
            return ["*"]
        return origins

    return [
        "null",
        "file://",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost",
        "http://127.0.0.1",
    ]


@asynccontextmanager
async def lifespan(_: FastAPI):
    await mongodb.connect()
    try:
        yield
    finally:
        await mongodb.disconnect()


app = FastAPI(
    title="Real-time Analytics Backend",
    version="1.0.0",
    description="FastAPI backend service for ingesting messages and returning analytics",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Sentinel Cloud Native Backend Running"}

@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
        logger.exception("Unexpected WebSocket error")

@app.post("/data", status_code=status.HTTP_201_CREATED, tags=["data"])
async def store_message(payload: MessageCreate) -> dict[str, object]:
    try:
        sentiment = analyze_sentiment(payload.message)
        keywords_found = await store_message_record_with_sentiment(
            message=payload.message,
            sentiment=sentiment,
            user=getattr(payload, "user", None),
        )
        await manager.broadcast_update()
    except PyMongoError as exc:
        logger.exception("Failed to store message or update analytics")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Please try again later.",
        ) from exc

    return {
        "status": "stored",
        "keywords_detected": keywords_found,
        "sentiment": sentiment,
    }


@app.get("/analytics", tags=["analytics"])
async def get_analytics(
    keyword: str | None = Query(default=None, min_length=1),
    hours: int = Query(default=24, ge=1, le=24 * 365),
) -> dict[str, object]:
    try:
        return await get_analytics_summary(keyword=keyword, hours=hours)
    except PyMongoError as exc:
        logger.exception("Failed to fetch analytics")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Please try again later.",
        ) from exc


@app.get("/sentiment", tags=["analytics"])
async def get_sentiment_stats() -> dict[str, int]:
    try:
        positive = await mongodb.messages_collection.count_documents(
            {"sentiment": "positive"}
        )
        negative = await mongodb.messages_collection.count_documents(
            {"sentiment": "negative"}
        )
        neutral = await mongodb.messages_collection.count_documents(
            {"sentiment": "neutral"}
        )
    except PyMongoError as exc:
        logger.exception("Failed to fetch sentiment analytics")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Please try again later.",
        ) from exc

    return {
        "positive": positive,
        "negative": negative,
        "neutral": neutral,
    }


@app.get("/messages", tags=["data"])
async def get_messages() -> list[dict[str, object]]:
    try:
        return await get_recent_messages()
    except PyMongoError as exc:
        logger.exception("Failed to fetch recent messages")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Please try again later.",
        ) from exc
