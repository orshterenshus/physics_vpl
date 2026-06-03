"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GraphData {
  x: number[];
  y: number[];
  label?: string;
}

export function GraphPanel({ data, isDark }: { data: GraphData; isDark: boolean }) {
  const points = data.x.map((x, i) => ({ x, y: data.y[i] }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 10, right: 10, bottom: 40, left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f2937" : "#e5e7eb"} />
        <XAxis dataKey="x" tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }} />
        <YAxis tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: isDark ? "#111827" : "#ffffff",
            border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
            color: isDark ? "#f9fafb" : "#111827",
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="y"
          name={data.label ?? "result"}
          stroke={isDark ? "#60a5fa" : "#2563eb"}
          dot={false}
          strokeWidth={1.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
