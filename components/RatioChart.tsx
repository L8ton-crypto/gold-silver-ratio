"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
);

type Point = { date: string; ratio: number };

type Props = {
  history: Point[];
  mean: number;
  plus1: number;
  minus1: number;
  plus2: number;
  minus2: number;
};

export default function RatioChart({ history, mean, plus1, minus1, plus2, minus2 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = history.map((p) => p.date);
    const n = history.length;

    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Gold/Silver Ratio",
            data: history.map((p) => p.ratio),
            borderColor: "#d4a017",
            backgroundColor: "rgba(212, 160, 23, 0.10)",
            borderWidth: 2,
            tension: 0.15,
            pointRadius: 0,
            fill: false,
          },
          {
            label: "+2 sigma",
            data: Array(n).fill(plus2),
            borderColor: "rgba(248, 113, 113, 0.55)",
            borderDash: [4, 4],
            borderWidth: 1,
            pointRadius: 0,
          },
          {
            label: "+1 sigma",
            data: Array(n).fill(plus1),
            borderColor: "rgba(248, 113, 113, 0.35)",
            borderDash: [2, 4],
            borderWidth: 1,
            pointRadius: 0,
          },
          {
            label: "Mean",
            data: Array(n).fill(mean),
            borderColor: "rgba(229, 229, 229, 0.55)",
            borderDash: [6, 4],
            borderWidth: 1,
            pointRadius: 0,
          },
          {
            label: "-1 sigma",
            data: Array(n).fill(minus1),
            borderColor: "rgba(74, 222, 128, 0.35)",
            borderDash: [2, 4],
            borderWidth: 1,
            pointRadius: 0,
          },
          {
            label: "-2 sigma",
            data: Array(n).fill(minus2),
            borderColor: "rgba(74, 222, 128, 0.55)",
            borderDash: [4, 4],
            borderWidth: 1,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: "#a3a3a3", boxWidth: 12, font: { size: 11 } },
            position: "bottom",
          },
          tooltip: {
            backgroundColor: "#171717",
            borderColor: "#404040",
            borderWidth: 1,
            titleColor: "#e5e5e5",
            bodyColor: "#e5e5e5",
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#737373",
              maxTicksLimit: 8,
              autoSkip: true,
            },
            grid: { color: "rgba(64,64,64,0.4)" },
          },
          y: {
            ticks: { color: "#737373", callback: (v) => Number(v).toFixed(0) },
            grid: { color: "rgba(64,64,64,0.4)" },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [history, mean, plus1, minus1, plus2, minus2]);

  return (
    <div className="relative h-[360px] sm:h-[440px] w-full">
      <canvas ref={ref} />
    </div>
  );
}
