from __future__ import annotations

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, status


CURRENT_DIR = Path(__file__).resolve().parent
COMMON_DIR = CURRENT_DIR.parents[2] / "common" / "python_common"
if str(COMMON_DIR) not in sys.path:
    sys.path.insert(0, str(COMMON_DIR))

from sentinel_common.config import KafkaSettings
from sentinel_common.producers.kafka import JsonKafkaProducer
from sentinel_common.schemas import IncomingMessage, RawMessage
from sentinel_common.topics import RAW_MESSAGES_TOPIC


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)s | ingestion | %(message)s",
)
logger = logging.getLogger(__name__)


class IngestionState:
    producer: JsonKafkaProducer | None = None


state = IngestionState()


@asynccontextmanager
async def lifespan(_: FastAPI):
    kafka_settings = KafkaSettings()
    state.producer = JsonKafkaProducer(kafka_settings)
    logger.info("Ingestion service connected to Kafka at %s", kafka_settings.bootstrap_servers)
    try:
        yield
    finally:
        if state.producer is not None:
            state.producer.close()


app = FastAPI(
    title="Sentinel Ingestion Service",
    version="2.0.0",
    description="Accepts inbound data and publishes raw messages to Kafka.",
    lifespan=lifespan,
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "ingestion-service"}


@app.post("/data", status_code=status.HTTP_202_ACCEPTED)
async def publish_data(payload: IncomingMessage) -> dict[str, str]:
    if state.producer is None:
        raise HTTPException(status_code=503, detail="Kafka producer is not ready")

    raw_message = RawMessage(**payload.model_dump())

    try:
        await asyncio.to_thread(
            state.producer.send,
            RAW_MESSAGES_TOPIC,
            raw_message.model_dump(mode="json"),
        )
    except Exception as exc:  # pragma: no cover - integration failure branch
        logger.exception("Failed to publish raw message")
        raise HTTPException(
            status_code=503,
            detail="Unable to publish the message to the event bus.",
        ) from exc

    return {"status": "accepted", "message_id": raw_message.message_id}

