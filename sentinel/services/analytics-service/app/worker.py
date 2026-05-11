from __future__ import annotations

import logging
import os
import sys
from pathlib import Path


CURRENT_DIR = Path(__file__).resolve().parent
COMMON_DIR = CURRENT_DIR.parents[2] / "common" / "python_common"
if str(COMMON_DIR) not in sys.path:
    sys.path.insert(0, str(COMMON_DIR))

from sentinel_common.config import KafkaSettings
from sentinel_common.consumers.kafka import build_json_consumer, iter_json_messages
from sentinel_common.producers.kafka import JsonKafkaProducer
from sentinel_common.schemas import ProcessedMessage
from sentinel_common.topics import ALERTS_TOPIC, PROCESSED_MESSAGES_TOPIC

from app.storage import AnalyticsRepository


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)s | analytics | %(message)s",
)
logger = logging.getLogger(__name__)


def run() -> None:
    kafka_settings = KafkaSettings()
    repository = AnalyticsRepository()
    repository.ensure_indexes()
    producer = JsonKafkaProducer(kafka_settings)
    consumer = build_json_consumer(
        settings=kafka_settings,
        topic=PROCESSED_MESSAGES_TOPIC,
        group_id=os.getenv("KAFKA_GROUP_ID", "analytics-service"),
    )

    logger.info("Analytics service consuming topic %s", PROCESSED_MESSAGES_TOPIC)

    try:
        while True:
            for record in iter_json_messages(consumer):
                processed = ProcessedMessage(**record.value)
                alerts = repository.store_processed_message(processed)
                for alert in alerts:
                    producer.send(ALERTS_TOPIC, alert.model_dump(mode="json"))
                logger.info("Stored analytics for message %s", processed.message_id)
    finally:
        consumer.close()
        producer.close()


if __name__ == "__main__":
    run()
