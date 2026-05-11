import logging
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta

from database import mongodb
from utils import KEYWORDS

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.utcnow()


def _build_query(keyword: str | None = None, hours: int = 24) -> dict[str, object]:
    query: dict[str, object] = {
        "timestamp": {"$gte": _utcnow() - timedelta(hours=hours)},
    }

    if keyword:
        query["message"] = {"$regex": re.escape(keyword), "$options": "i"}

    return query


def _extract_keywords(message: str) -> list[str]:
    normalized_text = message.lower()
    return [word for word in KEYWORDS if word in normalized_text]


async def process_keywords(text: str) -> list[str]:
    found = _extract_keywords(text)

    for word in found:
        await mongodb.analytics_collection.update_one(
            {"keyword": word},
            {"$inc": {"count": 1}},
            upsert=True,
        )

    return found


async def store_message_record(message: str, user: str | None = None) -> list[str]:
    document: dict[str, object] = {
        "user": user or "anonymous",
        "message": message,
        "timestamp": _utcnow(),
    }

    result = await mongodb.messages_collection.insert_one(document)
    print(f"Inserted message: {document}")
    logger.info("Inserted record: %s", {**document, "_id": str(result.inserted_id)})
    return await process_keywords(message)

async def store_message_record_with_sentiment(
    message: str,
    sentiment: str,
    user: str | None = None,
) -> list[str]:

    # 🔥 ensure proper datetime object (CRITICAL)
    timestamp = datetime.utcnow()

    document: dict[str, object] = {
        "user": user or "anonymous",
        "message": message,
        "sentiment": sentiment,
        "timestamp": timestamp,
    }

    result = await mongodb.messages_collection.insert_one(document)

    # ✅ Debug logs
    print(f"Inserted message: {document}")
    logger.info("Inserted record: %s", {**document, "_id": str(result.inserted_id)})

    return await process_keywords(message)


async def get_analytics_summary(
    keyword: str | None = None,
    hours: int = 24,
    latest_limit: int = 12,
) -> dict[str, object]:
    query = _build_query(keyword=keyword, hours=hours)
    documents = await mongodb.messages_collection.find(
        query,
        sort=[("timestamp", 1)],
    ).to_list(length=None)
    total_messages = len(documents)

    print(f"Analytics query result count: {total_messages}")
    logger.info(
        "Analytics query keyword=%r hours=%s matched=%s documents",
        keyword,
        hours,
        total_messages,
    )

    keyword_counts: Counter[str] = Counter()
    sentiment_totals = {"positive": 0, "negative": 0, "neutral": 0}
    time_buckets: dict[str, dict[str, object]] = defaultdict(
        lambda: {"label": "", "count": 0, "keywords": defaultdict(int)}
    )

    for document in documents:
        message = str(document.get("message", ""))
        timestamp = document.get("timestamp")
        sentiment = str(document.get("sentiment", "neutral")).lower()
        found_keywords = _extract_keywords(message)

        for matched_keyword in found_keywords:
            keyword_counts[matched_keyword] += 1

        sentiment_totals[sentiment if sentiment in sentiment_totals else "neutral"] += 1

        if isinstance(timestamp, datetime):
            bucket_label = timestamp.strftime("%Y-%m-%d %H:00")
        else:
            bucket_label = "Unknown"

        bucket = time_buckets[bucket_label]
        bucket["label"] = bucket_label
        bucket["count"] = int(bucket["count"]) + 1
        keyword_bucket = bucket["keywords"]

        for matched_keyword in found_keywords:
            keyword_bucket[matched_keyword] += 1

    latest_documents = documents[-latest_limit:]
    latest_messages = [
        {
            "id": str(document.get("_id", "")),
            "user": document.get("user"),
            "message": str(document.get("message", "")),
            "sentiment": str(document.get("sentiment", "neutral")).lower(),
            "timestamp": document.get("timestamp"),
            "keywords": _extract_keywords(str(document.get("message", ""))),
        }
        for document in reversed(latest_documents)
    ]

    time_series = [
        {
            "label": bucket["label"],
            "count": bucket["count"],
            "keywords": dict(sorted(bucket["keywords"].items())),
        }
        for _, bucket in sorted(time_buckets.items())
    ]

    return {
        "total_messages": total_messages,
        "keyword_counts": dict(sorted(keyword_counts.items())),
        "sentiment_totals": sentiment_totals,
        "time_series": time_series,
        "latest_messages": latest_messages,
    }


async def get_recent_messages(limit: int = 12) -> list[dict[str, object]]:
    documents = await mongodb.messages_collection.find(
        {},
        sort=[("timestamp", -1)],
        limit=limit,
    ).to_list(length=limit)

    recent_messages: list[dict[str, object]] = []
    for document in documents:
        message = str(document.get("message", ""))
        keywords = _extract_keywords(message)
        recent_messages.append(
            {
                "id": str(document.get("_id", "")),
                "user": document.get("user"),
                "message": message,
                "sentiment": document.get("sentiment", "neutral"),
                "timestamp": document.get("timestamp"),
                "keywords": keywords,
            }
        )

    return recent_messages
