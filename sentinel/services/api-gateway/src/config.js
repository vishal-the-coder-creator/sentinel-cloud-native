import process from "node:process";

import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 8000),
  kafkaBrokers: (process.env.KAFKA_BOOTSTRAP_SERVERS ?? "localhost:9092")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
  processedTopic: process.env.KAFKA_PROCESSED_TOPIC ?? "processed-messages",
  alertsTopic: process.env.KAFKA_ALERTS_TOPIC ?? "alerts",
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017",
  mongoDbName: process.env.MONGODB_DB_NAME ?? "sentinel",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379/0",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
};
