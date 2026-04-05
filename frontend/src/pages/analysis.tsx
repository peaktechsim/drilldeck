import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { DistributionChart } from "@/components/analysis/distribution-chart";
import { DrillComparisonChart } from "@/components/analysis/drill-comparison-chart";
import { PassRateChart } from "@/components/analysis/pass-rate-chart";
import { SessionHistory } from "@/components/analysis/session-history";
import { StatCards } from "@/components/analysis/stat-cards";
import { TimeTrendChart } from "@/components/analysis/time-trend-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

export default function AnalysisPage() {
  const { shooter } = useAuth();
  const [selectedShooterId, setSelectedShooterId] = useState<number | null>(shooter?.id ?? null);
  const [selectedDrillIds, setSelectedDrillIds] = useState<number[]>([]);

  const drillsQuery = useQuery({
    queryKey: ["drills"],
    queryFn: api.listDrills,
  });

  const shootersQuery = useQuery({
    queryKey: ["shooters"],
    queryFn: api.listShooters,
    enabled: Boolean(shooter?.isAdmin),
  });

  useEffect(() => {
    if (!shooter) {
      return;
    }

    setSelectedShooterId((current) => current ?? shooter.id);
  }, [shooter]);

  useEffect(() => {
    if (!drillsQuery.data?.length) {
      return;
    }

    setSelectedDrillIds((current) =>
      current.length > 0 ? current : drillsQuery.data.map((drill) => drill.id),
    );
  }, [drillsQuery.data]);

  const analysisQuery = useQuery({
    queryKey: ["analysis", selectedShooterId, selectedDrillIds],
    queryFn: () => api.getShooterAnalysis(selectedShooterId!, selectedDrillIds),
    enabled: selectedShooterId !== null && selectedDrillIds.length > 0,
  });

  const selectedDrills = useMemo(() => analysisQuery.data?.drills ?? [], [analysisQuery.data]);

  if (!shooter) {
    return null;
  }

  function toggleDrill(drillId: number) {
    setSelectedDrillIds((current) =>
      current.includes(drillId)
        ? current.filter((entry) => entry !== drillId)
        : [...current, drillId].sort((a, b) => a - b),
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Track trends, compare drills, and inspect detailed session history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Pick a shooter and the drills you want to compare.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {shooter.isAdmin ? (
            <div className="space-y-2">
              <Label htmlFor="analysis-shooter">Shooter</Label>
              <select
                id="analysis-shooter"
                value={selectedShooterId ?? ""}
                onChange={(event) => setSelectedShooterId(Number(event.target.value))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {(shootersQuery.data ?? []).map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              Viewing analysis for <span className="font-medium">{shooter.name}</span>
            </div>
          )}

          <div className="space-y-3">
            <Label>Drills</Label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {drillsQuery.data?.map((drill) => {
                const checked = selectedDrillIds.includes(drill.id);
                return (
                  <div
                    key={drill.id}
                    className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleDrill(drill.id)} />
                    <span>
                      <span className="block font-medium">{drill.name}</span>
                      <span className="text-muted-foreground">Standard {drill.timeStandard}s</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {drillsQuery.error ? (
            <p className="text-sm text-destructive">
              {drillsQuery.error instanceof Error
                ? drillsQuery.error.message
                : "Unable to load drills."}
            </p>
          ) : null}

          {shootersQuery.error ? (
            <p className="text-sm text-destructive">
              {shootersQuery.error instanceof Error
                ? shootersQuery.error.message
                : "Unable to load shooters."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {analysisQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading analysis…</p>
      ) : null}

      {analysisQuery.error ? (
        <p className="text-sm text-destructive">
          {analysisQuery.error instanceof Error
            ? analysisQuery.error.message
            : "Unable to load analysis."}
        </p>
      ) : null}

      {!analysisQuery.isLoading && !analysisQuery.error && selectedDrillIds.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Select at least one drill to view analysis.
          </CardContent>
        </Card>
      ) : null}

      {!analysisQuery.isLoading &&
      !analysisQuery.error &&
      selectedDrills.length === 0 &&
      selectedDrillIds.length > 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No recorded attempts yet for the current filter.
          </CardContent>
        </Card>
      ) : null}

      {selectedDrills.length > 0 ? (
        <div className="space-y-6">
          <div className="space-y-6">
            {selectedDrills.map((drill) => (
              <StatCards key={drill.drillId} drill={drill} />
            ))}
          </div>

          <TimeTrendChart drills={selectedDrills} />
          <PassRateChart drills={selectedDrills} />
          <DistributionChart drills={selectedDrills} />
          <DrillComparisonChart drills={selectedDrills} />
          <SessionHistory drills={selectedDrills} />
        </div>
      ) : null}
    </div>
  );
}
