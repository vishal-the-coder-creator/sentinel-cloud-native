const timeRangeMap = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

export function getTimeRangeStart(range) {
  if (!range || !timeRangeMap[range]) {
    return null;
  }

  return new Date(Date.now() - timeRangeMap[range]);
}

export function filterTimeSeries(points, range) {
  const start = getTimeRangeStart(range);
  if (!start) {
    return points;
  }

  return points.filter((point) => new Date(point.bucket) >= start);
}

export function filterMessages(messages, keyword, range) {
  const start = getTimeRangeStart(range);

  return messages.filter((message) => {
    const matchesKeyword = keyword
      ? (message.keywords ?? []).some((entry) => entry.toLowerCase() === keyword.toLowerCase())
      : true;
    const matchesRange = start ? new Date(message.processed_at ?? message.received_at) >= start : true;
    return matchesKeyword && matchesRange;
  });
}

export function buildMessageMatch({ keyword = "", timeRange = "" } = {}) {
  const match = {};
  const start = getTimeRangeStart(timeRange);

  if (start) {
    match.processed_at = { $gte: start };
  }

  if (keyword) {
    match.keywords = {
      $regex: `^${escapeRegex(keyword.trim())}$`,
      $options: "i",
    };
  }

  return match;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
