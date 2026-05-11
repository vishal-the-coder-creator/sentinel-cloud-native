from textblob import TextBlob

KEYWORDS = ["ai", "error", "warning", "fail", "success", "system", "memory", "stable"]

POSITIVE_HINTS = {"success", "stable", "healthy", "resolved", "improved", "smoothly"}
NEGATIVE_HINTS = {"error", "fail", "failure", "critical", "high memory", "warning"}

def analyze_sentiment(text):
    normalized = text.lower()

    if any(hint in normalized for hint in NEGATIVE_HINTS):
        return "negative"

    if any(hint in normalized for hint in POSITIVE_HINTS):
        return "positive"

    blob = TextBlob(text)
    polarity = blob.sentiment.polarity

    if polarity > 0:
        return "positive"
    elif polarity < 0:
        return "negative"
    else:
        return "neutral"
