"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MetricRadarChartProps {
  city: string;
  data: { metric: string; value: number }[];
}

function formatTooltipCount(value: unknown): string {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-IN").format(value);
  }

  return String(value);
}

export function MetricRadarChart({ city, data }: MetricRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 12, fill: "#cbd5e1" }}
        />
        <Radar
          name={city}
          dataKey="value"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.35}
        />
        <Tooltip
          formatter={formatTooltipCount}
          contentStyle={{
            backgroundColor: "#121518",
            border: "1px solid #475569",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#f1f5f9" }}
          itemStyle={{ color: "#fbbf24" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
