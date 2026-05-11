from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


class IncomingMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    user: str | None = Field(default=None, max_length=120)
    source: str = Field(default="frontend", max_length=120)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("message cannot be blank")
        return normalized


class RawMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: str(uuid4()))
    message: str
    user: str | None = None
    source: str = "frontend"
    metadata: dict[str, Any] = Field(default_factory=dict)
    received_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ProcessedMessage(RawMessage):
    sentiment: str
    sentiment_score: float
    keywords: list[str] = Field(default_factory=list)
    processed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    model_version: str = "textblob"


class AlertEvent(BaseModel):
    alert_id: str = Field(default_factory=lambda: str(uuid4()))
    keyword: str
    count: int
    threshold: int
    severity: str = "high"
    message: str
    window_minutes: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class TimeSeriesPoint(BaseModel):
    bucket: datetime
    count: int


class AnalyticsSnapshot(BaseModel):
    total_messages: int
    keyword_counts: dict[str, int]
    sentiment_totals: dict[str, int]
    time_series: list[TimeSeriesPoint]
    latest_messages: list[dict[str, Any]]
    active_alerts: list[AlertEvent] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

