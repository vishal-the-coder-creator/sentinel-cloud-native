const GRID_COLOR = "rgba(148, 163, 184, 0.08)";
const GRID_COLOR_SOFT = "rgba(148, 163, 184, 0.05)";
const TOOLTIP_BG = "rgba(8, 15, 29, 0.92)";

function getCssVariable(name, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function withAlpha(hexColor, alphaHex) {
  return `${hexColor}${alphaHex}`;
}

export function createLineGradient(context, startColor, endColor, fillOpacity = "2e") {
  const chartArea = context.chart?.chartArea;

  if (!chartArea) {
    return withAlpha(startColor, fillOpacity);
  }

  const gradient = context.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, withAlpha(startColor, fillOpacity));
  gradient.addColorStop(1, withAlpha(endColor, "00"));
  return gradient;
}

export function createBarGradient(context, startColor, endColor) {
  const chartArea = context.chart?.chartArea;

  if (!chartArea) {
    return startColor;
  }

  const gradient = context.chart.ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  return gradient;
}

export function createTooltipOptions() {
  return {
    backgroundColor: TOOLTIP_BG,
    borderColor: "rgba(148, 163, 184, 0.14)",
    borderWidth: 1,
    padding: 12,
    titleColor: "#f8fafc",
    bodyColor: "#dbe7f5",
    displayColors: true,
    boxPadding: 4,
    cornerRadius: 14,
    caretSize: 6,
    titleFont: {
      size: 12,
      weight: "700",
    },
    bodyFont: {
      size: 12,
      weight: "600",
    },
  };
}

export function createAxisOptions() {
  return {
    x: {
      border: { display: false },
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: getCssVariable("--muted", "#94a3b8"),
        maxRotation: 0,
        autoSkipPadding: 18,
        font: {
          size: 11,
          weight: "600",
        },
      },
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: {
        color: GRID_COLOR,
        drawBorder: false,
      },
      ticks: {
        precision: 0,
        color: getCssVariable("--muted", "#94a3b8"),
        padding: 10,
        font: {
          size: 11,
          weight: "600",
        },
      },
    },
  };
}

export function createBaseChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 120,
    interaction: { mode: "index", intersect: false },
    animation: {
      duration: 450,
      easing: "easeOutCubic",
    },
    elements: {
      line: {
        borderWidth: 2.5,
        tension: 0.4,
      },
      point: {
        radius: 0,
        hoverRadius: 5,
        hitRadius: 18,
        hoverBorderWidth: 3,
      },
    },
    plugins: {
      legend: {
        labels: {
          color: getCssVariable("--text", "#d2deef"),
          usePointStyle: true,
          pointStyle: "circle",
          padding: 18,
          boxWidth: 8,
          boxHeight: 8,
          font: {
            size: 11,
            weight: "700",
          },
        },
      },
      tooltip: createTooltipOptions(),
    },
    scales: createAxisOptions(),
  };
}

export function createSoftGridOptions() {
  const options = createBaseChartOptions();
  options.scales.y.grid.color = GRID_COLOR_SOFT;
  return options;
}
