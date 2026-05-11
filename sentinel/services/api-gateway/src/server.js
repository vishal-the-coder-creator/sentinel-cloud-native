import process from "node:process";
import http from "node:http";

import cors from "cors";
import express from "express";
import { WebSocketServer } from "ws";

import { config } from "./config.js";
import { startKafkaBroadcast } from "./kafkaBroadcast.js";
import { AnalyticsRepository } from "./repository.js";
import { WebSocketHub } from "./websocketHub.js";

const logger = console;
const app = express();
const server = http.createServer(app);
const hub = new WebSocketHub();
const repository = new AnalyticsRepository();

app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin }));
app.use(express.json());

app.get("/health", async (_request, response) => {
  response.json({ status: "ok", service: "api-gateway" });
});

app.get("/analytics", async (request, response) => {
  try {
    const summary = await repository.getSummary({
      keyword: String(request.query.keyword ?? ""),
      timeRange: String(request.query.timeRange ?? ""),
    });
    response.json(summary);
  } catch (error) {
    logger.error("Failed to fetch analytics summary", error);
    response.status(503).json({ detail: "Analytics data is temporarily unavailable." });
  }
});

app.get("/sentiment", async (_request, response) => {
  try {
    const summary = await repository.getSentimentSummary();
    response.json(summary);
  } catch (error) {
    logger.error("Failed to fetch sentiment summary", error);
    response.status(503).json({ detail: "Sentiment data is temporarily unavailable." });
  }
});

const wsServer = new WebSocketServer({ noServer: true });
wsServer.on("connection", async (socket) => {
  hub.add(socket);
  try {
    const summary = await repository.getSummary();
    socket.send(JSON.stringify({ type: "analytics_update", payload: summary }));
  } catch (error) {
    logger.error("Failed to send initial WebSocket state", error);
  }
});

server.on("upgrade", (request, socket, head) => {
  if (request.url !== "/ws") {
    socket.destroy();
    return;
  }

  wsServer.handleUpgrade(request, socket, head, (client) => {
    wsServer.emit("connection", client, request);
  });
});

let kafkaConsumer;

async function bootstrap() {
  await repository.connect();
  kafkaConsumer = await startKafkaBroadcast({ repository, hub, logger });
  server.listen(config.port, () => {
    logger.info(`API gateway listening on port ${config.port}`);
  });
}

async function shutdown() {
  logger.info("Shutting down API gateway");
  await kafkaConsumer?.disconnect();
  wsServer.clients.forEach((client) => client.close());
  await repository.disconnect();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

bootstrap().catch((error) => {
  logger.error("Failed to bootstrap API gateway", error);
  process.exit(1);
});
