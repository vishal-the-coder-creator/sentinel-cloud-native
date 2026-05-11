from __future__ import annotations

import os
from dataclasses import dataclass, field


def _get_list(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip().lower() for item in raw.split(",") if item.strip()]


@dataclass(slots=True)
class KafkaSettings:
    bootstrap_servers: str = field(
        default_factory=lambda: os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    )
    raw_topic: str = field(
        default_factory=lambda: os.getenv("KAFKA_RAW_TOPIC", "raw-messages")
    )
    processed_topic: str = field(
        default_factory=lambda: os.getenv("KAFKA_PROCESSED_TOPIC", "processed-messages")
    )
    alerts_topic: str = field(default_factory=lambda: os.getenv("KAFKA_ALERTS_TOPIC", "alerts"))
    producer_retries: int = field(default_factory=lambda: int(os.getenv("KAFKA_PRODUCER_RETRIES", "5")))
    producer_retry_backoff_ms: int = field(
        default_factory=lambda: int(os.getenv("KAFKA_PRODUCER_RETRY_BACKOFF_MS", "2000"))
    )
    consumer_poll_ms: int = field(default_factory=lambda: int(os.getenv("KAFKA_CONSUMER_POLL_MS", "1000")))


@dataclass(slots=True)
class ProcessingSettings:
    keywords: list[str] = field(
        default_factory=lambda: _get_list(
            "SENTINEL_KEYWORDS",
            "ai,error,warning,fail,success,outage,latency,incident",
        )
    )
    sentiment_provider: str = field(
        default_factory=lambda: os.getenv("SENTIMENT_PROVIDER", "textblob").lower()
    )
    sentiment_model: str = field(
        default_factory=lambda: os.getenv(
            "SENTIMENT_MODEL_NAME",
            "distilbert-base-uncased-finetuned-sst-2-english",
        )
    )


@dataclass(slots=True)
class AlertSettings:
    alert_keyword: str = field(default_factory=lambda: os.getenv("ALERT_KEYWORD", "error").lower())
    alert_threshold: int = field(default_factory=lambda: int(os.getenv("ALERT_THRESHOLD", "5")))
    alert_window_minutes: int = field(
        default_factory=lambda: int(os.getenv("ALERT_WINDOW_MINUTES", "10"))
    )

