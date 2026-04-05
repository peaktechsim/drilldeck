import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildHistogram, getDrillColor } from "@/components/analysis/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DrillAnalysis } from "@/lib/api";

export function DistributionChart({ drills }: { drills: DrillAnalysis[] }) {
  const histograms = useMemo(
    () =>
      drills.map((drill) => ({
        drill,
        data: buildHistogram(drill.entries.map((entry) => entry.timeEntered)),
      })),
    [drills],
  );

  if (histograms.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {histograms.map(({ drill, data }, index) => {
        const color = getDrillColor(index);

        return (
          <Card key={drill.drillId}>
            <CardHeader>
              <CardTitle>{drill.drillName} distribution</CardTitle>
              <CardDescription>
                Tight clusters suggest consistency. Wide spread suggests variability.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] px-2 sm:px-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 12, right: 20, left: 4, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="bucket"
                    angle={-25}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => value ?? "—"} />
                  <ReferenceLine
                    x={findReferenceBucket(data, drill.timeStandard)}
                    stroke="#dc2626"
                    strokeDasharray="6 6"
                    label={{
                      value: "Standard",
                      fill: "#dc2626",
                      fontSize: 12,
                      position: "insideTopRight",
                    }}
                  />
                  <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function findReferenceBucket(
  data: Array<{ bucket: string; mid: number }>,
  timeStandard: number,
): string | undefined {
  return data.find((entry) => timeStandard <= entry.mid)?.bucket ?? data[data.length - 1]?.bucket;
}

export default DistributionChart;
