import { useEffect } from "react";

import DashboardHeader from "./components/DashboardHeader.jsx";
import FilterControls from "./components/FilterControls.jsx";
import KeywordChart from "./components/KeywordChart.jsx";
import MessageVolumeChart from "./components/MessageVolumeChart.jsx";
import MessagesList from "./components/MessagesList.jsx";
import SectionBlock from "./components/SectionBlock.jsx";
import SentimentChart from "./components/SentimentChart.jsx";
import StatsCards from "./components/StatsCards.jsx";
import ToastViewport from "./components/ToastViewport.jsx";
import { useSentinelStore } from "./store.js";

function App() {
  const analytics = useSentinelStore((state) => state.analytics);
  const filters = useSentinelStore((state) => state.filters);
  const ui = useSentinelStore((state) => state.ui);
  const connection = useSentinelStore((state) => state.connection);
  const loadAnalytics = useSentinelStore((state) => state.loadAnalytics);
  const connectWebSocket = useSentinelStore((state) => state.connectWebSocket);
  const retryAnalytics = useSentinelStore((state) => state.retryAnalytics);
  const setFilters = useSentinelStore((state) => state.setFilters);
  const toggleTheme = useSentinelStore((state) => state.toggleTheme);
  const dismissToast = useSentinelStore((state) => state.dismissToast);

  useEffect(() => {
    document.documentElement.dataset.theme = ui.theme;
  }, [ui.theme]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const disconnect = connectWebSocket();
    return disconnect;
  }, [connectWebSocket]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div className="app-shell">
      <ToastViewport toasts={ui.toasts} onDismiss={dismissToast} />

      <DashboardHeader
        analytics={analytics}
        lastUpdated={analytics.updatedAt}
        connection={connection}
        backendEmpty={ui.backendEmpty}
        error={ui.error}
        loading={ui.loading}
        onRetry={retryAnalytics}
      />

      <FilterControls
        filters={filters}
        keywords={analytics.keywordTrend || []}
        theme={ui.theme}
        onChange={setFilters}
        onToggleTheme={toggleTheme}
      />

      <main className="dashboard-layout">
        <StatsCards
          analytics={analytics}
          connection={connection}
          loading={ui.loading}
          refreshTick={ui.refreshTick}
        />

        <SectionBlock
          eyebrow="Analytics"
          title="Performance overview"
          description="Core trends, live throughput, and sentiment behavior across the active stream."
        >
          <section className="dashboard-grid">
            <MessageVolumeChart
              analytics={analytics}
              loading={ui.loading}
              refreshTick={ui.refreshTick}
              onEmptyAction={retryAnalytics}
            />
            <SentimentChart
              analytics={analytics}
              loading={ui.loading}
              refreshTick={ui.refreshTick}
              onEmptyAction={retryAnalytics}
            />
            <KeywordChart
              analytics={analytics}
              loading={ui.loading}
              refreshTick={ui.refreshTick}
              onEmptyAction={retryAnalytics}
            />
          </section>
        </SectionBlock>

        <SectionBlock
          eyebrow="Activity"
          title="Recent message activity"
          description="Freshly enriched items, arranged for monitoring, debugging, and demo storytelling."
        >
          <section className="dashboard-grid">
            <MessagesList
              analytics={analytics}
              loading={ui.loading}
              refreshTick={ui.refreshTick}
              onEmptyAction={retryAnalytics}
            />
          </section>
        </SectionBlock>
      </main>
    </div>
  );
}

export default App;
