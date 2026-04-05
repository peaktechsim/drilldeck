import { Check, Printer, RotateCcw, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DrillFlowResult, Entry } from "./drill-flow";
import { SessionConfig } from "./session-setup";

type ScorecardProps = {
  config: SessionConfig;
  result: DrillFlowResult;
  onNewSession: () => void;
};

function formatTime(timeEntered: number) {
  return `${timeEntered.toFixed(2)}s`;
}

function groupEntries(entries: Entry[], shooterId: number, drillId: number) {
  return entries.filter((entry) => entry.shooterId === shooterId && entry.drillId === drillId);
}

function getPassRateVariant(passRate: number) {
  if (passRate > 70) {
    return "text-green-700 ring-green-500/30 bg-green-500/15 dark:text-green-300";
  }

  if (passRate >= 50) {
    return "text-yellow-700 ring-yellow-500/30 bg-yellow-500/15 dark:text-yellow-300";
  }

  return "text-red-700 ring-red-500/30 bg-red-500/15 dark:text-red-300";
}

export default function Scorecard({ config, result, onNewSession }: ScorecardProps) {
  const passCount = result.entries.filter((entry) => entry.pass).length;
  const passRate = result.entries.length ? (passCount / result.entries.length) * 100 : 0;
  const bestTime = result.entries.length
    ? Math.min(...result.entries.map((entry) => entry.timeEntered))
    : null;
  const worstTime = result.entries.length
    ? Math.max(...result.entries.map((entry) => entry.timeEntered))
    : null;

  async function handleSaveAndFinish() {
    try {
      await api.completeSession(result.sessionId);
    } catch {
      // Session is normally completed at the end of drill flow. Ignore duplicate completion failures here.
    }

    onNewSession();
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <div className="flex h-10 items-center justify-between gap-3 border-b border-border/50 px-4 sm:px-6">
        <p className="truncate text-sm font-medium">Scorecard</p>
        <Badge variant="outline" className="px-3 py-1 text-[11px] font-medium sm:text-xs">
          Session #{result.sessionId}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {config.shooters.length} shooters • {config.drills.length} drills
        </p>
      </div>

      <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Training complete</h1>
            <p className="text-sm text-muted-foreground">
              Review the line results, print a hard copy, or save and return to setup.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="px-3 py-1.5 text-sm ring-1 ring-border/60">
              Total entries: {result.entries.length}
            </Badge>
            <Badge
              variant="outline"
              className={cn("px-3 py-1.5 text-sm ring-1", getPassRateVariant(passRate))}
            >
              Pass rate: {passRate.toFixed(0)}%
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 text-sm ring-1 ring-border/60">
              Best time: {bestTime === null ? "—" : formatTime(bestTime)}
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 text-sm ring-1 ring-border/60">
              Worst time: {worstTime === null ? "—" : formatTime(worstTime)}
            </Badge>
          </div>

          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm print:rounded-none print:border-0 print:shadow-none">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-44">Shooter</TableHead>
                    {config.drills.map((drill) => (
                      <TableHead key={drill.id} className="min-w-40">
                        <div className="flex flex-col">
                          <span>{drill.name}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            Std. {drill.timeStandard}s
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.shooters.map((shooter, shooterIndex) => (
                    <TableRow key={shooter.id} className={cn(shooterIndex % 2 === 1 && "bg-muted/30")}>
                      <TableCell className="font-medium">{shooter.name}</TableCell>
                      {config.drills.map((drill) => {
                        const attempts = groupEntries(result.entries, shooter.id, drill.id);

                        return (
                          <TableCell key={`${shooter.id}-${drill.id}`}>
                            {attempts.length ? (
                              <div className="space-y-2">
                                {attempts.map((attempt, index) => (
                                  <div
                                    key={`${attempt.shooterId}-${attempt.drillId}-${index}`}
                                    className={cn(
                                      "rounded-xl border p-2.5",
                                      attempt.pass
                                        ? "border-green-500/20 bg-green-50 dark:bg-green-950/20"
                                        : "border-red-500/20 bg-red-50 dark:bg-red-950/20",
                                    )}
                                  >
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                      {attempt.pass ? (
                                        <Check className="size-4 text-green-600 dark:text-green-300" />
                                      ) : (
                                        <X className="size-4 text-red-600 dark:text-red-300" />
                                      )}
                                      <span>{attempt.pass ? "Pass" : "Fail"}</span>
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-foreground font-mono tabular-nums">
                                      {formatTime(attempt.timeEntered)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t bg-background/80 p-4 backdrop-blur-lg no-print">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="h-10" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
          <Button type="button" variant="outline" className="h-10" onClick={onNewSession}>
            <RotateCcw className="size-4" />
            New Session
          </Button>
          <Button type="button" className="h-10" onClick={() => void handleSaveAndFinish()}>
            <Save className="size-4" />
            Save & Finish
          </Button>
        </div>
      </div>
    </div>
  );
}
