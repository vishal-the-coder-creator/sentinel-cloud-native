import EmptyState from "./EmptyState.jsx";
import LoadingSkeleton from "./LoadingSkeleton.jsx";

function formatMessageTime(value) {
  if (!value) {
    return "Unknown time";
  }

  return new Date(value).toLocaleString();
}

function getSentimentLabel(sentiment) {
  return sentiment ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1) : "Unknown";
}

export default function MessagesList({ analytics, loading, refreshTick, onEmptyAction }) {
  const messages = analytics.latestMessages || [];

  return (
    <section className="panel messages-panel chart-span-12">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Live activity</p>
          <h2>Realtime message ticker</h2>
        </div>
        <p className="panel-description">Latest enriched messages flowing through the active stream.</p>
      </div>

      {loading ? (
        <div className="messages-loading">
          <LoadingSkeleton className="skeleton-row" count={4} />
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          message="No activity is available for the current filters yet."
          actionLabel="Retry analytics"
          onAction={onEmptyAction}
        />
      ) : (
        <div className="messages-feed" key={refreshTick}>
          <div className="messages-feed__rail" aria-hidden="true" />
          <div className="messages-list">
            {messages.map((message, index) => (
              <article
                className="message-card"
                key={message.id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="message-card__top">
                  <div className="message-card__status">
                    <span
                      className={`message-card__dot message-card__dot-${message.sentiment.toLowerCase()}`}
                      aria-hidden="true"
                    />
                    <strong>{message.author}</strong>
                  </div>
                  <span className={`sentiment-chip sentiment-${message.sentiment.toLowerCase()}`}>
                    {getSentimentLabel(message.sentiment)}
                  </span>
                </div>
                <p>{message.text}</p>
                <div className="message-card__meta">
                  <span>{formatMessageTime(message.time)}</span>
                  <span>{message.keywords.join(", ") || "no keywords detected"}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
