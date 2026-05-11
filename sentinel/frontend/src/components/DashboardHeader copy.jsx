// function formatUpdatedAt(updatedAt) {
//   if (!updatedAt) {
//     return "Waiting for first sync";
//   }

//   return new Date(updatedAt).toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });
// }

// function getBackendIndicator(connection) {
//   if (connection.status === "live") {
//     return {
//       label: "Backend Live",
//       tone: "live-indicator-success",
//     };
//   }

//   if (connection.status === "reconnecting") {
//     return {
//       label: "Reconnecting",
//       tone: "live-indicator-warning",
//     };
//   }

//   return {
//     label: "Backend Offline",
//     tone: "live-indicator-danger",
//   };
// }

// function getWebSocketLabel(connection) {
//   if (connection.status === "live") {
//     return "Streaming";
//   }

//   if (connection.status === "reconnecting") {
//     return `Retry ${Math.max(connection.reconnectAttempt, 1)}`;
//   }

//   if (connection.status === "connecting") {
//     return "Connecting";
//   }

//   return "Offline";
// }

// function getMongoLabel({ error, backendEmpty, loading, analytics }) {
//   if (error) {
//     return "Unknown";
//   }

//   if (loading && !analytics.updatedAt) {
//     return "Checking";
//   }

//   if (analytics.totalMessages > 0 || backendEmpty) {
//     return "Synced";
//   }

//   return "Checking";
// }

// function getStatusTone(value) {
//   if (value === "Streaming" || value === "Synced" || value === "Backend Live") {
//     return "status-pill-success";
//   }

//   if (value === "Reconnecting" || value.startsWith("Retry") || value === "Checking") {
//     return "status-pill-warning";
//   }

//   return "status-pill-danger";
// }

// export default function DashboardHeader({
//   analytics,
//   lastUpdated,
//   connection,
//   backendEmpty,
//   error,
//   loading,
//   onRetry,
// }) {
//   const backendIndicator = getBackendIndicator(connection);
//   const lastSynced = formatUpdatedAt(lastUpdated);
//   const websocketState = getWebSocketLabel(connection);
//   const mongoState = getMongoLabel({ error, backendEmpty, loading, analytics });

//   const systemStatuses = [
//     { label: "Backend", value: backendIndicator.label },
//     { label: "Last updated", value: lastSynced, tone: "status-pill-neutral" },
//     { label: "WebSocket", value: websocketState },
//     { label: "MongoDB", value: mongoState },
//   ];

//   return (
//     <header className="dashboard-hero panel">
//       <div className="dashboard-hero__main">
//         <div className="dashboard-hero__topline">
//           <p className="dashboard-label">Sentinel Analytics</p>
//           <div className={`live-indicator ${backendIndicator.tone}`}>
//             <span className="live-indicator__dot" aria-hidden="true" />
//             <span>{backendIndicator.label}</span>
//           </div>
//         </div>

//         <div className="dashboard-hero__copy">
//           <h1>Real Time Threat Monitoring</h1>
//           <p>
//             Live telemetry, keyword trends, and sentiment analytics streaming from your backend
//             infrastructure.
//           </p>
//         </div>
//       </div>

//       <div className="dashboard-status-bar">
//         {systemStatuses.map((item) => (
//           <div className="dashboard-status-bar__item" key={item.label}>
//             <span className="dashboard-status-bar__label">{item.label}</span>
//             <span className={`status-pill ${item.tone || getStatusTone(item.value)}`}>{item.value}</span>
//           </div>
//         ))}
//       </div>

//       {error ? (
//         <div className="dashboard-header-alert dashboard-header-alert-warning">
//           <div>
//             <p className="dashboard-header-alert__title">Analytics sync warning</p>
//             <p>{error}</p>
//           </div>
//           <button className="primary-button" type="button" onClick={onRetry}>
//             Retry connection
//           </button>
//         </div>
//       ) : null}

//       {backendEmpty && !loading && !error ? (
//         <div className="dashboard-header-alert dashboard-header-alert-muted">
//           <div>
//             <p className="dashboard-header-alert__title">No results for the current filters</p>
//             <p>Clear the keyword filter or widen the time range to show more live analytics.</p>
//           </div>
//           <button className="primary-button" type="button" onClick={onRetry}>
//             Refresh analytics
//           </button>
//         </div>
//       ) : null}
//     </header>
//   );
// }
