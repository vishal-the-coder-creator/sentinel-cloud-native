function formatUpdatedAt(updatedAt) {
  if (!updatedAt) {
    return "Waiting for first sync";
  }

  return new Date(updatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getBackendIndicator(connection) {
  if (connection.status === "live") {
    return {
      label: "Connected",
      tone: "live-indicator-success",
    };
  }

  if (connection.status === "reconnecting" || connection.status === "connecting") {
    return {
      label: connection.status === "connecting" ? "Connecting" : "Reconnecting",
      tone: "live-indicator-warning",
    };
  }

  return {
    label: "Disconnected",
    tone: "live-indicator-danger",
  };
}

function getWebSocketLabel(connection) {
  if (connection.status === "live") {
    return "Streaming";
  }

  if (connection.status === "reconnecting") {
    return `Retry ${Math.max(connection.reconnectAttempt, 1)}`;
  }

  if (connection.status === "connecting") {
    return "Connecting";
  }

  return "Offline";
}

function getMongoLabel({ error, backendEmpty, loading, analytics }) {
  if (error) {
    return "Unknown";
  }

  if (loading && !analytics.updatedAt) {
    return "Checking";
  }

  if (analytics.totalMessages > 0 || backendEmpty) {
    return "Synced";
  }

  return "Checking";
}

function getStatusTone(value) {
  if (value === "Streaming" || value === "Synced" || value === "Connected") {
    return "status-pill-success";
  }

  if (value === "Connecting" || value === "Checking" || value.startsWith("Retry")) {
    return "status-pill-warning";
  }

  return "status-pill-danger";
}

export default function DashboardHeader({
  analytics,
  lastUpdated,
  connection,
  backendEmpty,
  error,
  loading,
  onRetry,
}) {
  const backendIndicator = getBackendIndicator(connection);
  const lastSynced = formatUpdatedAt(lastUpdated);
  const websocketState = getWebSocketLabel(connection);
  const mongoState = getMongoLabel({ error, backendEmpty, loading, analytics });

  const systemStatuses = [
    {
      label: "WebSocket",
      value: websocketState,
    },
    {
      label: "Analytics store",
      value: mongoState,
    },
    {
      label: "Last updated",
      value: lastSynced,
      tone: "status-pill-neutral",
    },
  ];

  return (
    <header className="dashboard-hero panel">
      <div className="dashboard-hero__main">
        <div className="dashboard-hero__topline">
          <div className="dashboard-brand-badge">
            <span className="dashboard-brand-badge__glow" />
                <span className="dashboard-brand-badge__text">Sentinel Cloud Native</span>
          </div>
          <div className={`live-indicator ${backendIndicator.tone}`}>
            <span className="live-indicator__pulse" aria-hidden="true">
              <span className="live-indicator__dot" />
            </span>
            <span>{backendIndicator.label}</span>
          </div>
        </div>

        <div className="dashboard-hero__copy">
          <h1>Real Time Data Analytics</h1>
          <p>
            Monitor live telemetry, streaming insights, keyword activity, and sentiment analytics
            across cloud native infrastructure in real time.
          </p>
        </div>
      </div>

      <div className="dashboard-status-bar">
        {systemStatuses.map((item) => (
          <div className="dashboard-status-bar__item" key={item.label}>
            <span className="dashboard-status-bar__label">{item.label}</span>
            <span className={`status-pill ${item.tone || getStatusTone(item.value)}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {error ? (
        <div className="dashboard-header-alert dashboard-header-alert-warning">
          <div>
            <p className="dashboard-header-alert__title">Analytics sync warning</p>
            <p>{error}</p>
          </div>
          <button className="primary-button" type="button" onClick={onRetry}>
            Retry connection
          </button>
        </div>
      ) : null}

      {backendEmpty && !loading && !error ? (
        <div className="dashboard-header-alert dashboard-header-alert-muted">
          <div>
            <p className="dashboard-header-alert__title">No results for the current filters</p>
            <p>Clear the keyword filter or widen the time range to show more live analytics.</p>
          </div>
          <button className="primary-button" type="button" onClick={onRetry}>
            Refresh analytics
          </button>
        </div>
      ) : null}
    </header>
  );
}
