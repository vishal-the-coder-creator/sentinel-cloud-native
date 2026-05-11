import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import ChartCard from "./ChartCard.jsx";
import { createTooltipOptions } from "./chartTheme.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue("--text-strong"),
          usePointStyle: true,
          boxWidth: 10,
          padding: 18,
          font: {
            size: 11,
            weight: "700",
          },
        },
      },
      tooltip: createTooltipOptions(),
    },
    animation: {
      duration: 450,
      easing: "easeOutCubic",
    },
  };
}

export default function SentimentChart({ analytics, loading, refreshTick, onEmptyAction }) {
  const sentiment = analytics.sentiment || [];
  const total = sentiment.reduce((sum, entry) => sum + entry.value, 0);
  const data = {
    labels: sentiment.map((entry) => entry.label),
    datasets: [
      {
        data: sentiment.map((entry) => entry.value),
        backgroundColor: sentiment.map((entry) => entry.color),
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        spacing: 4,
        hoverOffset: 6,
        borderRadius: 8,
      },
    ],
  };

  return (
    <ChartCard
      eyebrow="Sentiment"
      title="Sentiment split"
      description={`${total} messages classified in the active view.`}
      loading={loading}
      empty={total === 0}
      emptyMessage="No data available for sentiment analysis."
      emptyActionLabel="Retry analytics"
      onEmptyAction={onEmptyAction}
      className="chart-span-4"
    >
      <div className="chart-canvas" key={refreshTick}>
        <Doughnut data={data} options={getChartOptions()} />
      </div>
    </ChartCard>
  );
}
