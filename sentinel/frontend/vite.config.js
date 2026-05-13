import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 3000,
    strictPort: true,
    proxy: {
      "/analytics": "http://127.0.0.1:8000",
      "/data": "http://127.0.0.1:8000",
      "/messages": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
      "/ws": {
        target: "ws://127.0.0.1:8000",
        ws: true,
      },
    },
  },
  base: "./",
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 4173,
    strictPort: true,
  },
});
