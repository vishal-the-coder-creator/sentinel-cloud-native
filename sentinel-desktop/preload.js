import { contextBridge } from "electron";

const backendHost = process.env.SENTINEL_BACKEND_HOST || "127.0.0.1";
const backendPort = process.env.SENTINEL_BACKEND_PORT || "8000";

contextBridge.exposeInMainWorld("sentinelDesktop", {
  isDesktop: true,
  apiBase: `http://${backendHost}:${backendPort}`,
  wsBase: `ws://${backendHost}:${backendPort}/ws`,
  backendHost,
  backendPort,
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node
  }
});
