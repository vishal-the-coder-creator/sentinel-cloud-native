import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

import ChartCard from "./ChartCard.jsx";
import { createBaseChartOptions, createLineGradient } from "./chartTheme.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const lineColors = [
  { border: "#38bdf8", fill: "#38bdf8" },
  { border: "#34d399", fill: "#34d399" },
  { border: "#f59e0b", fill: "#f59e0b" },
];

function getChartOptions() {
  const options = createBaseChartOptions();
  options.plugins.legend.position = "bottom";
  options.scales.y.suggestedMax = 8;
  return options;
}

export default function KeywordChart({ analytics, loading, refreshTick, onEmptyAction }) {
  const keywordTrend = (analytics.messageVolume || []).map((point) => ({
    label: point.label,
    ...(point.keywords || {}),
  }));
  const keys = keywordTrend.length ? Object.keys(keywordTrend[0]).filter((key) => key !== "label") : [];

  const data = {
    labels: keywordTrend.map((point) => point.label),
    datasets: keys.map((key, index) => ({
      label: key,
      data: keywordTrend.map((point) => point[key] ?? 0),
      borderColor: lineColors[index % lineColors.length].border,
      backgroundColor: (context) =>
        createLineGradient(
          context,
          lineColors[index % lineColors.length].fill,
          lineColors[index % lineColors.length].fill,
        ),
      tension: 0.4,
      fill: true,
      pointHoverBackgroundColor: "#f8fbff",
      pointHoverBorderColor: lineColors[index % lineColors.length].border,
    })),
  };

  return (
    <ChartCard
      eyebrow="Keywords"
      title="Keyword trend"
      description="Track the most active terms over time."
      loading={loading}
      empty={keys.length === 0}
      emptyMessage="No data available for keyword trends."
      emptyActionLabel="Retry analytics"
      onEmptyAction={onEmptyAction}
      className="chart-span-8"
    >
      <div className="chart-canvas" key={refreshTick}>
        <Line data={data} options={getChartOptions()} />
      </div>
    </ChartCard>
  );
}
