from __future__ import annotations

import logging
import os
import sys
from pathlib import Path


CURRENT_DIR = Path(__file__).resolve().parent
COMMON_DIR = CURRENT_DIR.parents[2] / "common" / "python_common"
if str(COMMON_DIR) not in sys.path:
    sys.path.insert(0, str(COMMON_DIR))

from sentinel_common.config import KafkaSettings, ProcessingSettings
from sentinel_common.consumers.kafka import build_json_consumer, iter_json_messages
from sentinel_common.producers.kafka import JsonKafkaProducer
from sentinel_common.schemas import ProcessedMessage, RawMessage
from sentinel_common.topics import PROCESSED_MESSAGES_TOPIC, RAW_MESSAGES_TOPIC

from app.sentiment import SentimentAnalyzer


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)s | processing | %(message)s",
)
logger = logging.getLogger(__name__)


def extract_keywords(message: str, keywords: list[str]) -> list[str]:
    normalized = message.lower()
    return [keyword for keyword in keywords if keyword in normalized]


def run() -> None:
    kafka_settings = KafkaSettings()
    processing_settings = ProcessingSettings()
    analyzer = SentimentAnalyzer(processing_settings)
    producer = JsonKafkaProducer(kafka_settings)
    consumer = build_json_consumer(
        settings=kafka_settings,
        topic=RAW_MESSAGES_TOPIC,
        group_id=os.getenv("KAFKA_GROUP_ID", "processing-service"),
    )

    logger.info("Processing service consuming topic %s", RAW_MESSAGES_TOPIC)

    try:
        while True:
            for record in iter_json_messages(consumer):
                raw_message = RawMessage(**record.value)
                sentiment = analyzer.analyze(raw_message.message)
                processed = ProcessedMessage(
                    **raw_message.model_dump(),
                    sentiment=sentiment.label,
                    sentiment_score=sentiment.score,
                    keywords=extract_keywords(raw_message.message, processing_settings.keywords),
                    model_version=sentiment.model_version,
                )
                producer.send(PROCESSED_MESSAGES_TOPIC, processed.model_dump(mode="json"))
                logger.info("Processed message %s", processed.message_id)
    finally:
        consumer.close()
        producer.close()


if __name__ == "__main__":
    run()
