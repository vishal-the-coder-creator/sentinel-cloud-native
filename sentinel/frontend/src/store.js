import { create } from "zustand";

import { fetchAnalytics } from "./services/api.js";
import { createAnalyticsWebSocket } from "./services/websocket.js";

const THEME_STORAGE_KEY = "sentinel-theme";
const WS_RECONNECT_DELAY_MS = 3000;

function logDebug(event, payload) {
  console.info(`[Sentinel] ${event}`, payload ?? "");
}

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const emptyAnalytics = {
  totalMessages: 0,
  filteredMessages: 0,
  availableKeywords: [],
  keywordTrend: [],
  messageVolume: [],
  sentiment: [],
  latestMessages: [],
  updatedAt: null,
};

function createToast(message, tone = "info") {
  return {
    id: `${tone}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    tone,
  };
}

function normalizeAnalytics(raw = {}) {
  const sentimentTotals = raw.sentiment_totals || {};
  const timeSeries = Array.isArray(raw.time_series) ? raw.time_series : [];
  const keywordCounts = raw.keyword_counts || {};
  const latestMessages = Array.isArray(raw.latest_messages) ? raw.latest_messages : [];
  const updatedAt = latestMessages[0]?.timestamp || raw.updated_at || new Date().toISOString();

  return {
    totalMessages: raw.total_messages || 0,
    filteredMessages: raw.filtered_message_count || raw.total_messages || 0,
    availableKeywords: Object.keys(keywordCounts),
    keywordTrend: Object.entries(keywordCounts)
      .map(([keyword, count]) => ({
        keyword,
        count,
      }))
      .sort((left, right) => right.count - left.count),
    messageVolume: timeSeries.map((point) => ({
      label: point.label || "Unknown",
      count: point.count || 0,
      keywords: point.keywords || {},
    })),
    sentiment: [
      { label: "Positive", value: sentimentTotals.positive || 0, color: "#34d399" },
      { label: "Negative", value: sentimentTotals.negative || 0, color: "#f87171" },
      { label: "Neutral", value: sentimentTotals.neutral || 0, color: "#94a3b8" },
    ],
    latestMessages: latestMessages.map((message, index) => ({
      id: message.id || `${message.user || "message"}-${index}`,
      author: message.user || "Unknown user",
      text: message.message || "",
      sentiment: String(message.sentiment || "neutral").toLowerCase(),
      keywords: Array.isArray(message.keywords) ? message.keywords : [],
      time: message.timestamp || null,
    })),
    updatedAt,
  };
}

export const useSentinelStore = create((set, get) => {
  let socketCleanup = null;
  let reconnectTimer = null;
  let shouldReconnect = true;

  const setConnection = (patch) =>
    set((state) => ({
      connection: {
        ...state.connection,
        ...patch,
      },
    }));

  const pushToast = (message, tone = "info") =>
    set((state) => ({
      ui: {
        ...state.ui,
        toasts: [...state.ui.toasts.slice(-3), createToast(message, tone)],
      },
    }));

  const scheduleReconnect = () => {
    if (!shouldReconnect) {
      return;
    }

    clearTimeout(reconnectTimer);
    reconnectTimer = window.setTimeout(() => {
      get().connectWebSocket();
    }, WS_RECONNECT_DELAY_MS);
  };

  return {
    analytics: emptyAnalytics,

    filters: {
      keyword: "",
      hours: 24,
    },

    ui: {
      loading: true,
      error: "",
      backendEmpty: false,
      theme: getInitialTheme(),
      refreshTick: 0,
      retryCount: 0,
      toasts: [],
    },

    connection: {
      status: "connecting",
      reconnectAttempt: 0,
    },

    dismissToast: (toastId) =>
      set((state) => ({
        ui: {
          ...state.ui,
          toasts: state.ui.toasts.filter((toast) => toast.id !== toastId),
        },
      })),

    setFilters: (nextFilters) => {
      set((state) => ({
        filters: {
          ...state.filters,
          ...nextFilters,
        },
      }));

      void get().loadAnalytics();
    },

    loadAnalytics: async (background = false) => {
      const { filters } = get();

      set((state) => ({
        ui: {
          ...state.ui,
          loading: background ? state.ui.loading : true,
          error: "",
        },
      }));

      try {
        logDebug("Fetching analytics", filters);
        const payload = await fetchAnalytics(filters);
        const normalized = normalizeAnalytics(payload);
        const hasData = normalized.totalMessages > 0;

        set((state) => ({
          analytics: normalized,
          ui: {
            ...state.ui,
            loading: false,
            error: "",
            backendEmpty: !hasData,
            refreshTick: state.ui.refreshTick + 1,
          },
        }));

        logDebug("Analytics loaded", normalized);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to load analytics from the backend.";
        logDebug("Analytics fetch failed", message);

        set((state) => ({
          ui: {
            ...state.ui,
            loading: false,
            error: message,
            backendEmpty: false,
            retryCount: state.ui.retryCount + 1,
          },
        }));

        pushToast(message, "error");
      }
    },

    connectWebSocket: () => {
      shouldReconnect = true;
      clearTimeout(reconnectTimer);

      if (socketCleanup) {
        socketCleanup();
        socketCleanup = null;
      }

      setConnection({ status: "connecting" });

      socketCleanup = createAnalyticsWebSocket({
        onOpen: () => {
          logDebug("WebSocket connected");
          setConnection({ status: "live", reconnectAttempt: 0 });
        },
        onMessage: () => {
          logDebug("WebSocket message received");
          void get().loadAnalytics(true);
        },
        onError: (error) => {
          logDebug("WebSocket error", error?.message || error);
          setConnection({ status: "error" });
        },
        onClose: () => {
          if (!shouldReconnect) {
            setConnection({ status: "disconnected" });
            return;
          }

          set((state) => ({
            connection: {
              status: "reconnecting",
              reconnectAttempt: state.connection.reconnectAttempt + 1,
            },
          }));

          pushToast("Live stream disconnected. Reconnecting to Sentinel backend...", "warning");
          scheduleReconnect();
        },
      });

      return () => {
        shouldReconnect = false;
        clearTimeout(reconnectTimer);
        socketCleanup?.();
        socketCleanup = null;
        setConnection({ status: "disconnected" });
      };
    },

    retryAnalytics: () => {
      pushToast("Retrying analytics sync...", "info");
      void get().loadAnalytics();
    },

    toggleTheme: () =>
      set((state) => {
        const next = state.ui.theme === "dark" ? "light" : "dark";

        if (typeof window !== "undefined") {
          window.localStorage.setItem(THEME_STORAGE_KEY, next);
          document.documentElement.dataset.theme = next;
        }

        return {
          ui: {
            ...state.ui,
            theme: next,
          },
        };
      }),
  };
});
