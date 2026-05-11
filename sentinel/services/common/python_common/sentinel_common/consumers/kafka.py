from __future__ import annotations

import json

from confluent_kafka import Consumer

from sentinel_common.config import KafkaSettings


class JsonConsumerRecord:
    def __init__(self, value: dict) -> None:
        self.value = value


def build_json_consumer(*, settings: KafkaSettings, topic: str, group_id: str) -> Consumer:
    consumer = Consumer(
        {
            "bootstrap.servers": settings.bootstrap_servers,
            "group.id": group_id,
            "auto.offset.reset": "earliest",
        }
    )
    consumer.subscribe([topic])
    return consumer


def iter_json_messages(consumer: Consumer, timeout_seconds: float = 1.0):
    while True:
        message = consumer.poll(timeout_seconds)
        if message is None:
            continue
        if message.error():
            raise RuntimeError(str(message.error()))
        payload = json.loads(message.value().decode("utf-8"))
        yield JsonConsumerRecord(payload)
