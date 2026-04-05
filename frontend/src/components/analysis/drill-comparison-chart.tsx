import { useMemo } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { computeConsistencyScore, getDrillColor } from "@/components/analysis/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DrillAnalysis } from "@/lib/api";

type RadarMetric = {
  metric: string;
  [key: string]: number | string;
};

export function DrillComparisonChart({ drills }: { drills: DrillAnalysis[] }) {
  const data = useMemo<RadarMetric[]>(() => {
    const metrics: RadarMetric[] = [
      { metric: "Pass Rate" },
      { metric: "Consistency" },
      { metric: "Speed" },
    ];

    drills.forEach((drill) => {
      const average = drill.stats.average ?? 0;
      const speed =
        average > 0 ? Math.min(100, Number(((drill.timeStandard / average) * 100).toFixed(1))) : 0;
      const consistency = computeConsistencyScore(drill.entries.map((entry) => entry.timeEntered));

      metrics[0][`drill-${drill.drillId}`] = Number(drill.stats.passRate.toFixed(1));
      metrics[1][`drill-${drill.drillId}`] = consistency;
      metrics[2][`drill-${drill.drillId}`] = speed;
    });

    return metrics;
  }, [drills]);

  if (drills.length < 2) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drill comparison</CardTitle>
        <CardDescription>
          Compare pass rate, consistency, and speed across the selected drills.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[360px] px-2 sm:px-6">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <Tooltip formatter={(value) => (value == null ? "—" : `${String(value)}%`)} />
            <Legend />
            {drills.map((drill, index) => {
              const color = getDrillColor(index);
              return (
                <Radar
                  key={drill.drillId}
                  dataKey={`drill-${drill.drillId}`}
                  name={drill.drillName}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                />
              );
            })}
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default DrillComparisonChart;
