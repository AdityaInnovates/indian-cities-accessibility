"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RankingChartProps {
  data: { city: string; score: number }[];
}

function formatTooltipScore(value: unknown): string {
  if (typeof value === "number") {
    return `${value.toFixed(1)} / 100`;
  }

  return String(value);
}

export function RankingChart({ data }: RankingChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 15, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: "#cbd5e1", fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="city"
          width={92}
          tick={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 600 }}
        />
        <Tooltip
          formatter={formatTooltipScore}
          contentStyle={{
            backgroundColor: "#121518",
            border: "1px solid #475569",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#f1f5f9" }}
          itemStyle={{ color: "#fbbf24" }}
          cursor={{ fill: "rgba(148, 163, 184, 0.18)" }}
        />
        <Bar dataKey="score" fill="#f59e0b" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
