import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import ChartCard from "./ChartCard.jsx";
import { createBarGradient, createSoftGridOptions } from "./chartTheme.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function getChartOptions() {
  const options = createSoftGridOptions();
  options.plugins.legend.display = false;
  options.scales.y.suggestedMax = 10;
  return options;
}

export default function MessageVolumeChart({ analytics, loading, refreshTick, onEmptyAction }) {
  const messageVolume = (analytics.messageVolume || []).map((point) => ({
    label: point.label,
    count: point.count || 0,
  }));

  const data = {
    labels: messageVolume.map((point) => point.label),
    datasets: [
      {
        label: "Messages",
        data: messageVolume.map((point) => point.count),
        borderRadius: 999,
        borderSkipped: false,
        maxBarThickness: 24,
        backgroundColor: (context) => createBarGradient(context, "#f59e0b99", "#fb7185"),
        hoverBackgroundColor: (context) => createBarGradient(context, "#fbbf24", "#fb7185"),
      },
    ],
  };

  return (
    <ChartCard
      eyebrow="Volume"
      title="Message volume over time"
      description="Live throughput across the selected time range."
      loading={loading}
      empty={messageVolume.length === 0}
      emptyMessage="No data available for message volume."
      emptyActionLabel="Retry analytics"
      onEmptyAction={onEmptyAction}
      className="chart-span-8"
    >
      <div className="chart-canvas" key={refreshTick}>
        <Bar data={data} options={getChartOptions()} />
      </div>
    </ChartCard>
  );
}
