from __future__ import annotations

import json
import os
from datetime import UTC, datetime, timedelta
from typing import Any

from pymongo import MongoClient, ReturnDocument
from redis import Redis

from sentinel_common.config import AlertSettings
from sentinel_common.schemas import AlertEvent, AnalyticsSnapshot, ProcessedMessage, TimeSeriesPoint


class AnalyticsRepository:
    def __init__(self) -> None:
        self.mongo = MongoClient(
            os.getenv("MONGODB_URI", "mongodb://localhost:27017"),
            serverSelectionTimeoutMS=int(os.getenv("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "5000")),
        )
        database_name = os.getenv("MONGODB_DB_NAME", "sentinel")
        self.db = self.mongo[database_name]
        self.redis = Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)
        self.alert_settings = AlertSettings()

    def ensure_indexes(self) -> None:
        self.db.messages.create_index("received_at")
        self.db.messages.create_index("keywords")
        self.db.analytics.create_index("type")
        self.db.sentiment_summary.create_index("updated_at")

    def store_processed_message(self, message: ProcessedMessage) -> list[AlertEvent]:
        payload = message.model_dump(mode="json")
        increment_map: dict[str, int] = {"total_messages": 1}
        increment_map.update({f"keyword_counts.{keyword}": 1 for keyword in message.keywords})
        self.db.messages.update_one(
            {"message_id": message.message_id},
            {"$set": payload},
            upsert=True,
        )

        bucket = message.processed_at.replace(second=0, microsecond=0, tzinfo=UTC)
        self.db.analytics.update_one(
            {"_id": "global", "type": "summary"},
            {
                "$setOnInsert": {"type": "summary"},
                "$inc": increment_map,
                "$push": {
                    "latest_messages": {
                        "$each": [
                            {
                                "message_id": message.message_id,
                                "message": message.message,
                                "user": message.user,
                                "sentiment": message.sentiment,
                                "keywords": message.keywords,
                                "received_at": message.received_at,
                                "processed_at": message.processed_at,
                            }
                        ],
                        "$position": 0,
                        "$slice": 20,
                    }
                },
                "$set": {"updated_at": datetime.now(UTC)},
            },
            upsert=True,
        )
        self.db.analytics.update_one(
            {"_id": f"timeseries:{bucket.isoformat()}", "type": "timeseries"},
            {
                "$setOnInsert": {"type": "timeseries", "bucket": bucket},
                "$inc": {"count": 1},
                "$set": {"updated_at": datetime.now(UTC)},
            },
            upsert=True,
        )
        self.db.sentiment_summary.find_one_and_update(
            {"_id": "global"},
            {
                "$setOnInsert": {"positive": 0, "negative": 0, "neutral": 0},
                "$inc": {message.sentiment: 1},
                "$set": {"updated_at": datetime.now(UTC)},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )

        alerts = self._evaluate_alerts(message)
        self._cache_snapshot(alerts)
        return alerts

    def _evaluate_alerts(self, message: ProcessedMessage) -> list[AlertEvent]:
        if self.alert_settings.alert_keyword not in message.keywords:
            return []

        window_start = datetime.now(UTC) - timedelta(minutes=self.alert_settings.alert_window_minutes)
        count = self.db.messages.count_documents(
            {
                "keywords": self.alert_settings.alert_keyword,
                "processed_at": {"$gte": window_start},
            }
        )

        if count < self.alert_settings.alert_threshold:
            return []

        alert = AlertEvent(
            keyword=self.alert_settings.alert_keyword,
            count=count,
            threshold=self.alert_settings.alert_threshold,
            message=(
                f"Keyword '{self.alert_settings.alert_keyword}' spiked to {count} "
                f"events in the last {self.alert_settings.alert_window_minutes} minutes."
            ),
            window_minutes=self.alert_settings.alert_window_minutes,
        )
        self.redis.set("analytics:last_alert", alert.model_dump_json())
        return [alert]

    def build_snapshot(self) -> AnalyticsSnapshot:
        summary = self.db.analytics.find_one({"_id": "global"}) or {}
        sentiment = self.db.sentiment_summary.find_one({"_id": "global"}) or {}
        series_docs = list(
            self.db.analytics.find({"type": "timeseries"}, {"_id": 0, "bucket": 1, "count": 1}).sort("bucket", 1)
        )
        last_alert_raw = self.redis.get("analytics:last_alert")
        alerts = [AlertEvent.model_validate_json(last_alert_raw)] if last_alert_raw else []

        snapshot = AnalyticsSnapshot(
            total_messages=int(summary.get("total_messages", 0)),
            keyword_counts={key: int(value) for key, value in (summary.get("keyword_counts") or {}).items()},
            sentiment_totals={
                "positive": int(sentiment.get("positive", 0)),
                "negative": int(sentiment.get("negative", 0)),
                "neutral": int(sentiment.get("neutral", 0)),
            },
            time_series=[
                TimeSeriesPoint(bucket=doc["bucket"], count=int(doc.get("count", 0)))
                for doc in series_docs
            ],
            latest_messages=list(summary.get("latest_messages", [])),
            active_alerts=alerts,
            updated_at=summary.get("updated_at", datetime.now(UTC)),
        )
        return snapshot

    def _cache_snapshot(self, alerts: list[AlertEvent]) -> None:
        snapshot = self.build_snapshot()
        if alerts:
            snapshot.active_alerts = alerts
        self.redis.set("analytics:summary", snapshot.model_dump_json())
        self.redis.set("analytics:sentiment", json.dumps(snapshot.sentiment_totals))
