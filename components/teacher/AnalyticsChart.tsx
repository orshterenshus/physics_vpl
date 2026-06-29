"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "next-themes";

export interface ChartRow {
  title: string;
  avgGrade: number;
}

export function AnalyticsChart({ data }: { data: ChartRow[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f2937" : "#e5e7eb"} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }} />
        <YAxis type="category" dataKey="title" width={160} tick={{ fill: isDark ? "#9ca3af" : "#6b7280", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: isDark ? "#111827" : "#ffffff",
            border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
            color: isDark ? "#f9fafb" : "#111827",
            fontSize: 11,
          }}
        />
        <Bar dataKey="avgGrade" name="Average grade" fill={isDark ? "#60a5fa" : "#2563eb"} />
      </BarChart>
    </ResponsiveContainer>
  );
}
