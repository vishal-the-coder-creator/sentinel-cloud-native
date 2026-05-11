from __future__ import annotations

from dataclasses import dataclass

from textblob import TextBlob

from sentinel_common.config import ProcessingSettings


try:  # pragma: no cover - optional runtime dependency path
    from transformers import pipeline
except Exception:  # pragma: no cover
    pipeline = None


@dataclass(slots=True)
class SentimentResult:
    label: str
    score: float
    model_version: str


class SentimentAnalyzer:
    def __init__(self, settings: ProcessingSettings) -> None:
        self.settings = settings
        self._pipeline = None

        if settings.sentiment_provider == "transformers" and pipeline is not None:
            self._pipeline = pipeline("sentiment-analysis", model=settings.sentiment_model)

    def analyze(self, text: str) -> SentimentResult:
        if self._pipeline is not None:
            result = self._pipeline(text[:512])[0]
            label = result["label"].lower()
            mapped = "positive" if "pos" in label else "negative"
            score = float(result["score"])
            return SentimentResult(mapped, score, self.settings.sentiment_model)

        polarity = float(TextBlob(text).sentiment.polarity)
        if polarity > 0.1:
            label = "positive"
        elif polarity < -0.1:
            label = "negative"
        else:
            label = "neutral"
        return SentimentResult(label, polarity, "textblob")

