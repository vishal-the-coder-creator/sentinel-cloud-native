import CountUpValue from "./CountUpValue.jsx";
import LoadingSkeleton from "./LoadingSkeleton.jsx";

function getSentimentCount(sentiment, label) {
  return sentiment.find((entry) => entry.label.toLowerCase() === label)?.value ?? 0;
}

export default function StatsCards({ analytics, connection, loading, refreshTick }) {
  const sentiment = Array.isArray(analytics.sentiment) ? analytics.sentiment : [];
  const totalKeywords = analytics.availableKeywords?.length || 0;
  const positiveCount = getSentimentCount(sentiment, "positive");
  const neutralCount = getSentimentCount(sentiment, "neutral");
  const negativeCount = getSentimentCount(sentiment, "negative");
  const connectionMeta =
    connection.status === "live"
      ? "WebSocket stream is flowing in real time"
      : connection.status === "reconnecting"
        ? "Live feed is retrying with auto-reconnect"
        : "Realtime connection is standing by";

  const cards = [
    {
      label: "Total messages",
      value: analytics.totalMessages,
      meta: "Messages returned by the active analytics filters",
      detail: connectionMeta,
      tone: "brand",
    },
    {
      label: "Active alerts",
      value: negativeCount,
      meta: "Negative sentiment events requiring attention",
      detail: "Derived from the current enriched message stream",
      tone: "danger",
    },
    {
      label: "Positive sentiment",
      value: positiveCount,
      meta: "Healthy message volume in the current window",
      detail: "Strong signals across the active infrastructure feed",
      tone: "success",
    },
    {
      label: "Neutral sentiment",
      value: neutralCount,
      meta: "Informational or non-escalated activity",
      detail: "Useful for baseline traffic and behavior monitoring",
      tone: "neutral",
    },
    {
      label: "Negative sentiment",
      value: negativeCount,
      meta: "Potential issues surfaced by enrichment",
      detail: "Track spikes to identify incident patterns quickly",
      tone: "warning",
    },
    {
      label: "Keywords monitored",
      value: totalKeywords,
      meta: "Searchable terms across the selected window",
      detail: "Coverage updates with every analytics refresh",
      tone: connection.status === "live" ? "success" : "brand",
    },
  ];

  return (
    <section className="stats-grid">
      {cards.map((card, index) => (
        <article
          className={`stat-card stat-card-${card.tone} panel`}
          key={`${card.label}-${refreshTick}`}
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <p className="section-kicker">{card.label}</p>
          {loading ? (
            <LoadingSkeleton className="skeleton-heading stat-card__skeleton-value" />
          ) : (
            <strong className="stat-card__value">
              <CountUpValue value={card.value} className="stat-card__value-text" />
            </strong>
          )}
          {loading ? (
            <>
              <LoadingSkeleton className="skeleton-copy" />
              <LoadingSkeleton className="skeleton-copy skeleton-copy-short" />
            </>
          ) : (
            <>
              <p>{card.meta}</p>
              <span className="stat-card__detail">{card.detail}</span>
            </>
          )}
        </article>
      ))}
    </section>
  );
}
