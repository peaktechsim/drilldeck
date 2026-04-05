import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { findAnnotations, getDrillColor } from "@/components/analysis/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DrillAnalysis } from "@/lib/api";

type TimeTrendRow = {
  attempt: number;
  [key: string]: number | string | null;
};

export function TimeTrendChart({ drills }: { drills: DrillAnalysis[] }) {
  const maxAttempts = Math.max(0, ...drills.map((drill) => drill.entries.length));
  const annotations = findAnnotations(drills);

  const data: TimeTrendRow[] = Array.from({ length: maxAttempts }, (_, index) => {
    const row: TimeTrendRow = { attempt: index + 1 };

    drills.forEach((drill) => {
      const entry = drill.entries[index];
      row[`drill-${drill.drillId}`] = entry?.timeEntered ?? null;
    });

    return row;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time trend</CardTitle>
        <CardDescription>
          Attempt-by-attempt times with standards and milestone annotations.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[360px] px-2 sm:px-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 20, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="attempt" allowDecimals={false} />
            <YAxis unit="s" />
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? `${value.toFixed(2)}s` : (value ?? "—")
              }
            />
            <Legend />

            {drills.map((drill, index) => {
              const color = getDrillColor(index);
              return (
                <ReferenceLine
                  key={`standard-${drill.drillId}`}
                  y={drill.timeStandard}
                  stroke={color}
                  strokeDasharray="6 6"
                  ifOverflow="extendDomain"
                  label={{
                    value: `${drill.drillName} standard`,
                    fill: color,
                    fontSize: 12,
                    position: "insideTopRight",
                  }}
                />
              );
            })}

            {drills.map((drill, index) => (
              <Line
                key={drill.drillId}
                type="monotone"
                dataKey={`drill-${drill.drillId}`}
                name={drill.drillName}
                stroke={getDrillColor(index)}
                strokeWidth={3}
                dot={{ r: 3 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}

            {annotations.map((annotation) => (
              <ReferenceDot
                key={`${annotation.drillId}-${annotation.label}-${annotation.attempt}-${annotation.value}`}
                x={annotation.attempt}
                y={annotation.value}
                r={6}
                fill={annotation.color}
                stroke="white"
                label={{
                  value: annotation.label,
                  fill: annotation.color,
                  fontSize: 12,
                  position: "top",
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default TimeTrendChart;
