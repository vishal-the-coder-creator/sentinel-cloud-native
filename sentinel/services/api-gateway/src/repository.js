import { MongoClient } from "mongodb";
import { createClient } from "redis";

import { config } from "./config.js";
import { buildMessageMatch } from "./filters.js";

export class AnalyticsRepository {
  constructor() {
    this.mongoClient = new MongoClient(config.mongoUri);
    this.redisClient = createClient({ url: config.redisUrl });
    this.db = null;
  }

  async connect() {
    await this.mongoClient.connect();
    await this.redisClient.connect();
    this.db = this.mongoClient.db(config.mongoDbName);
  }

  async disconnect() {
    await this.redisClient.quit();
    await this.mongoClient.close();
  }

  async getSummary({ keyword = "", timeRange = "" } = {}) {
    const normalizedKeyword = keyword.trim();
    const match = buildMessageMatch({ keyword: normalizedKeyword, timeRange });
    const baseSnapshot = await this.buildSummaryFromMongo();
    const [filteredMessageCount, latestMessages, timeSeries, keywordCounts, sentimentTotals, latestFilteredDoc] =
      await Promise.all([
        this.db.collection("messages").countDocuments(match),
        this.db
          .collection("messages")
          .find(match, {
            projection: {
              _id: 0,
              message_id: 1,
              message: 1,
              user: 1,
              sentiment: 1,
              keywords: 1,
              received_at: 1,
              processed_at: 1,
            },
          })
          .sort({ processed_at: -1, received_at: -1 })
          .limit(20)
          .toArray(),
        this.getFilteredTimeSeries(match),
        this.getKeywordCounts(match),
        this.getSentimentTotals(match),
        this.db
          .collection("messages")
          .find(match, { projection: { _id: 0, processed_at: 1, received_at: 1 } })
          .sort({ processed_at: -1, received_at: -1 })
          .limit(1)
          .next(),
      ]);

    return {
      ...baseSnapshot,
      keyword_filter: normalizedKeyword || null,
      time_range: timeRange || null,
      keyword_counts: keywordCounts,
      sentiment_totals: sentimentTotals,
      time_series: timeSeries,
      latest_messages: latestMessages,
      filtered_message_count: filteredMessageCount,
      updated_at:
        latestFilteredDoc?.processed_at ??
        latestFilteredDoc?.received_at ??
        baseSnapshot.updated_at,
    };
  }

  async getSentimentSummary() {
    const cached = await this.redisClient.get("analytics:sentiment");
    if (cached) {
      return JSON.parse(cached);
    }

    const summary = await this.db.collection("sentiment_summary").findOne({ _id: "global" });
    return {
      positive: Number(summary?.positive ?? 0),
      negative: Number(summary?.negative ?? 0),
      neutral: Number(summary?.neutral ?? 0),
    };
  }

  async buildSummaryFromMongo() {
    const [summary, sentiment, timeSeries, lastAlert] = await Promise.all([
      this.db.collection("analytics").findOne({ _id: "global" }),
      this.db.collection("sentiment_summary").findOne({ _id: "global" }),
      this.db
        .collection("analytics")
        .find({ type: "timeseries" }, { projection: { _id: 0, bucket: 1, count: 1 } })
        .sort({ bucket: 1 })
        .toArray(),
      this.redisClient.get("analytics:last_alert"),
    ]);

    return {
      total_messages: Number(summary?.total_messages ?? 0),
      keyword_counts: summary?.keyword_counts ?? {},
      sentiment_totals: {
        positive: Number(sentiment?.positive ?? 0),
        negative: Number(sentiment?.negative ?? 0),
        neutral: Number(sentiment?.neutral ?? 0),
      },
      time_series: timeSeries,
      latest_messages: summary?.latest_messages ?? [],
      active_alerts: lastAlert ? [JSON.parse(lastAlert)] : [],
      updated_at: summary?.updated_at ?? new Date().toISOString(),
    };
  }

  async getFilteredTimeSeries(match) {
    const rows = await this.db
      .collection("messages")
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateTrunc: {
                date: "$processed_at",
                unit: "minute",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            bucket: "$_id",
            count: 1,
          },
        },
      ])
      .toArray();

    return rows.map((row) => ({
      bucket: row.bucket,
      count: Number(row.count ?? 0),
    }));
  }

  async getKeywordCounts(match) {
    const rows = await this.db
      .collection("messages")
      .aggregate([
        { $match: match },
        { $unwind: "$keywords" },
        {
          $group: {
            _id: "$keywords",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1, _id: 1 } },
      ])
      .toArray();

    return Object.fromEntries(
      rows.map((row) => [String(row._id), Number(row.count ?? 0)])
    );
  }

  async getSentimentTotals(match) {
    const rows = await this.db
      .collection("messages")
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: "$sentiment",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    return rows.reduce(
      (totals, row) => ({
        ...totals,
        [row._id]: Number(row.count ?? 0),
      }),
      { positive: 0, negative: 0, neutral: 0 }
    );
  }
}
