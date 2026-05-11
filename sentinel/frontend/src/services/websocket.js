const DEFAULT_REMOTE_WS_URL = "ws://127.0.0.1:8000/ws";

function getDesktopConfig() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sentinelDesktop || null;
}

function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getConfiguredWsBase() {
  return import.meta.env.VITE_GATEWAY_WS_URL?.trim() || "";
}

function normalizeConfiguredWsBase(rawBase) {
  if (!rawBase || !isBrowser()) {
    return rawBase;
  }

  try {
    const configuredUrl = new URL(rawBase);
    const currentHostname = window.location.hostname;

    if (!isLoopbackHost(configuredUrl.hostname) || isLoopbackHost(currentHostname)) {
      return configuredUrl.toString();
    }

    configuredUrl.hostname = currentHostname;
    return configuredUrl.toString();
  } catch {
    return rawBase;
  }
}

function getWebSocketUrl() {
  const desktopWsBase = getDesktopConfig()?.wsBase?.trim();
  if (desktopWsBase) {
    return desktopWsBase;
  }

  if (!isBrowser()) {
    return DEFAULT_REMOTE_WS_URL;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const port = window.location.port;
  const isViteDevPort = port === "3000" || port === "4173";

  if (isViteDevPort) {
    return `${protocol}//${window.location.host}/ws`;
  }

  const configuredBase = normalizeConfiguredWsBase(getConfiguredWsBase());
  if (configuredBase) {
    return configuredBase;
  }

  return `${protocol}//${window.location.host}/ws`;
}

export function createAnalyticsWebSocket(handlers) {
  let socket = null;
  let closedByClient = false;
  const url = getWebSocketUrl();

  try {
    socket = new WebSocket(url);
  } catch (error) {
    handlers.onError?.(error);
    handlers.onClose?.();
    return () => {};
  }

  socket.onopen = () => {
    handlers.onOpen?.();
  };

  socket.onmessage = (event) => {
    handlers.onMessage?.(event);
  };

  socket.onerror = () => {
    handlers.onError?.(new Error(`WebSocket connection failed for ${url}`));
  };

  socket.onclose = () => {
    if (!closedByClient) {
      handlers.onClose?.();
    }
  };

  return () => {
    closedByClient = true;

    if (socket && socket.readyState <= WebSocket.OPEN) {
      socket.close();
    }
  };
}
