import { Clock3, Flame, Hash, Target, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { DrillAnalysis } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent, formatSeconds } from "@/components/analysis/utils";

type StatDefinition = {
  key: string;
  label: string;
  getIcon: (drill: DrillAnalysis) => LucideIcon;
  render: (drill: DrillAnalysis) => string;
  valueClassName?: (drill: DrillAnalysis) => string | undefined;
};

const statConfig: StatDefinition[] = [
  {
    key: "personalBest",
    label: "Personal Best",
    getIcon: () => Clock3,
    render: (drill) => formatSeconds(drill.stats.personalBest),
  },
  {
    key: "average",
    label: "Average",
    getIcon: () => Target,
    render: (drill) => formatSeconds(drill.stats.average),
  },
  {
    key: "passRate",
    label: "Pass Rate",
    getIcon: (drill: DrillAnalysis) => (drill.stats.passRate >= 50 ? TrendingUp : TrendingDown),
    valueClassName: (drill) => (drill.stats.passRate >= 50 ? "text-emerald-600" : "text-red-600"),
    render: (drill) => formatPercent(drill.stats.passRate),
  },
  {
    key: "totalAttempts",
    label: "Total Attempts",
    getIcon: () => Hash,
    render: (drill) => String(drill.stats.totalAttempts),
  },
  {
    key: "currentStreak",
    label: "Current Streak",
    getIcon: () => Flame,
    render: (drill) => {
      const { type, count } = drill.stats.currentStreak;
      if (!type || count === 0) {
        return "No streak";
      }

      return `${count} ${type === "pass" ? "passes" : "fails"}`;
    },
    valueClassName: (drill) =>
      drill.stats.currentStreak.type === "pass"
        ? "text-amber-600"
        : drill.stats.currentStreak.type === "fail"
          ? "text-red-600"
          : undefined,
  },
];

export function StatCards({ drill }: { drill: DrillAnalysis }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{drill.drillName}</h2>
        <p className="text-sm text-muted-foreground">Quick stats for this drill.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statConfig.map((stat) => {
          const Icon = stat.getIcon(drill);
          const valueClassName = stat.valueClassName?.(drill);

          return (
            <Card key={stat.key}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <Icon className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className={cn("text-3xl font-semibold tracking-tight", valueClassName)}>{stat.render(drill)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default StatCards;
