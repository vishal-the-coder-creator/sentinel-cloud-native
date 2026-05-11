import { Kafka } from "kafkajs";

import { config } from "./config.js";

export async function startKafkaBroadcast({ repository, hub, logger }) {
  const kafka = new Kafka({
    clientId: "sentinel-api-gateway",
    brokers: config.kafkaBrokers,
  });

  const consumer = kafka.consumer({ groupId: "sentinel-gateway-broadcast" });
  await consumer.connect();
  await consumer.subscribe({ topic: config.processedTopic, fromBeginning: false });
  await consumer.subscribe({ topic: config.alertsTopic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return;
      }

      const payload = JSON.parse(message.value.toString());

      if (topic === config.processedTopic) {
        const snapshot = await repository.getSummary();
        hub.broadcast({ type: "analytics_update", payload: snapshot });
        logger.info("Broadcast analytics update for message %s", payload.message_id);
        return;
      }

      if (topic === config.alertsTopic) {
        hub.broadcast({ type: "alert", payload });
        logger.info("Broadcast alert %s", payload.alert_id);
      }
    },
  });

  return consumer;
}
