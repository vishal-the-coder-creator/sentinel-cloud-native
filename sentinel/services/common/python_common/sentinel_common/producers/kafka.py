from __future__ import annotations

import json
from typing import Any

from confluent_kafka import Producer

from sentinel_common.config import KafkaSettings
from sentinel_common.retry import retry_sync


class JsonKafkaProducer:
    def __init__(self, settings: KafkaSettings) -> None:
        self.settings = settings
        self._producer = Producer(
            {
                "bootstrap.servers": self.settings.bootstrap_servers,
                "acks": "all",
                "retries": self.settings.producer_retries,
                "retry.backoff.ms": self.settings.producer_retry_backoff_ms,
            }
        )

    def send(self, topic: str, payload: dict[str, Any]) -> None:
        def _publish() -> None:
            self._producer.produce(
                topic,
                json.dumps(payload, default=str).encode("utf-8"),
            )
            self._producer.flush()

        retry_sync(
            _publish,
            attempts=self.settings.producer_retries,
            delay_seconds=max(self.settings.producer_retry_backoff_ms / 1000, 1),
            operation_name=f"publish:{topic}",
        )

    def close(self) -> None:
        self._producer.flush()
