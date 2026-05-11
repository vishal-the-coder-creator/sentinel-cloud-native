from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MessageCreate(BaseModel):
    user: str | None = Field(default=None, max_length=255, description="Optional user identifier")
    message: str = Field(..., min_length=1, max_length=5000, description="Message payload")

    @field_validator("user")
    @classmethod
    def strip_user(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None

    @field_validator("message")
    @classmethod
    def strip_and_validate(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message cannot be blank")
        return value


class MessageInDB(BaseModel):
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MessageCreateResponse(BaseModel):
    id: str
    message: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyticsResponse(BaseModel):
    total_messages: int
