const DEFAULT_REMOTE_API_BASE = "http://127.0.0.1:8000";
const API_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

function getDesktopConfig() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sentinelDesktop || null;
}

function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function sleep(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getConfiguredHttpBase() {
  return import.meta.env.VITE_GATEWAY_HTTP_URL?.trim() || "";
}

function normalizeConfiguredBase(rawBase) {
  if (!rawBase || !isBrowser()) {
    return rawBase;
  }

  try {
    const configuredUrl = new URL(rawBase);
    const currentHostname = window.location.hostname;

    if (!isLoopbackHost(configuredUrl.hostname) || isLoopbackHost(currentHostname)) {
      return configuredUrl.toString().replace(/\/$/, "");
    }

    configuredUrl.hostname = currentHostname;
    return configuredUrl.toString().replace(/\/$/, "");
  } catch {
    return rawBase.replace(/\/$/, "");
  }
}

function getApiBase() {
  const desktopBase = getDesktopConfig()?.apiBase?.trim();
  if (desktopBase) {
    return desktopBase.replace(/\/$/, "");
  }

  if (!isBrowser()) {
    return DEFAULT_REMOTE_API_BASE;
  }

  const port = window.location.port;
  const isViteDevPort = port === "3000" || port === "4173";

  if (isViteDevPort) {
    return "";
  }

  const configuredBase = normalizeConfiguredBase(getConfiguredHttpBase());

  if (configuredBase) {
    return configuredBase;
  }

  return window.location.origin;
}

function buildApiUrl(path, params) {
  const queryString = params?.toString();
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBase();
  const url = `${base}${pathname}`;

  return queryString ? `${url}?${queryString}` : url;
}

async function requestJson(url, options = {}, attempt = 0) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      let details = `Request failed with status ${response.status}`;

      try {
        const body = await response.json();
        details = body.detail || details;
      } catch {
        // Keep the default message if the response is not JSON.
      }

      throw new Error(details);
    }

    return await response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Analytics request timed out. Retrying...");
    }

    const isNetworkError =
      error instanceof TypeError ||
      /Failed to fetch/i.test(String(error?.message || ""));

    if (attempt >= MAX_RETRIES) {
      if (isNetworkError) {
        throw new Error("Unable to reach the analytics API. Check the frontend proxy or backend server.");
      }

      throw error instanceof Error ? error : new Error("Unable to reach Sentinel backend.");
    }

    await sleep((attempt + 1) * 600);
    return requestJson(url, options, attempt + 1);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchAnalytics(filters = {}) {
  const params = new URLSearchParams();

  if (filters.keyword?.trim()) {
    params.set("keyword", filters.keyword.trim());
  }

  params.set("hours", String(filters.hours || 24));

  return requestJson(buildApiUrl("/analytics", params));
}

export { buildApiUrl, getApiBase };
