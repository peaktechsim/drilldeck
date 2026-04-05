import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDrillColor } from "@/components/analysis/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DrillAnalysis } from "@/lib/api";

type PassRateChartProps = {
  drills: DrillAnalysis[];
  windowSize?: number;
};

type PassRateRow = {
  attempt: number;
  [key: string]: number | string | null;
};

export function PassRateChart({ drills, windowSize = 10 }: PassRateChartProps) {
  const data = useMemo<PassRateRow[]>(() => {
    const maxAttempts = Math.max(0, ...drills.map((drill) => drill.entries.length));

    return Array.from({ length: maxAttempts }, (_, index) => {
      const row: PassRateRow = { attempt: index + 1 };

      drills.forEach((drill) => {
        const start = Math.max(0, index + 1 - windowSize);
        const slice = drill.entries.slice(start, index + 1);
        row[`drill-${drill.drillId}`] =
          slice.length === 0
            ? null
            : Number(
                ((slice.filter((entry) => entry.pass).length / slice.length) * 100).toFixed(1),
              );
      });

      return row;
    });
  }, [drills, windowSize]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rolling pass rate</CardTitle>
        <CardDescription>
          Pass rate over the last {windowSize} attempts for each selected drill.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[320px] px-2 sm:px-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 20, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="attempt" allowDecimals={false} />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? `${value.toFixed(1)}%` : (value ?? "—")
              }
            />
            <Legend />
            {drills.map((drill, index) => {
              const color = getDrillColor(index);
              return (
                <Area
                  key={drill.drillId}
                  type="monotone"
                  dataKey={`drill-${drill.drillId}`}
                  name={drill.drillName}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                  strokeWidth={3}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default PassRateChart;
