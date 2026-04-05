import { Check, Printer, RotateCcw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import type { DrillFlowResult, Entry } from "./drill-flow";
import type { SessionConfig } from "./session-setup";

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

export default function Scorecard({ config, result, onNewSession }: ScorecardProps) {
  async function handleSaveAndFinish() {
    try {
      await api.completeSession(result.sessionId);
    } catch {
      // Session is normally completed at the end of drill flow. Ignore duplicate completion failures here.
    }
  }

  return (
    <Card className="print:shadow-none">
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Scorecard</CardTitle>
          <CardDescription>
            Session #{result.sessionId} • {config.shooters.length} shooters • {config.drills.length} drills
          </CardDescription>
        </div>

        <div className="flex flex-wrap gap-3 no-print">
          <Button type="button" variant="outline" className="h-11" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print / PDF
          </Button>
          <Button type="button" variant="outline" className="h-11" onClick={onNewSession}>
            <RotateCcw className="size-4" />
            New session
          </Button>
          <Button type="button" className="h-11" onClick={() => void handleSaveAndFinish()}>
            <Save className="size-4" />
            Save & Finish
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-44">Shooter</TableHead>
              {config.drills.map((drill) => (
                <TableHead key={drill.id} className="min-w-40">
                  <div className="flex flex-col">
                    <span>{drill.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">Std. {drill.timeStandard}s</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.shooters.map((shooter) => (
              <TableRow key={shooter.id}>
                <TableCell className="font-medium">{shooter.name}</TableCell>
                {config.drills.map((drill) => {
                  const attempts = groupEntries(result.entries, shooter.id, drill.id);

                  return (
                    <TableCell key={`${shooter.id}-${drill.id}`}>
                      {attempts.length ? (
                        <div className="space-y-2">
                          {attempts.map((attempt, index) => (
                            <div key={`${attempt.shooterId}-${attempt.drillId}-${index}`} className="rounded-lg border bg-muted/10 p-2">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                {attempt.pass ? (
                                  <Check className="size-4 text-green-600" />
                                ) : (
                                  <X className="size-4 text-red-600" />
                                )}
                                <span>{attempt.pass ? "Pass" : "Fail"}</span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{formatTime(attempt.timeEntered)}</p>
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
      </CardContent>
    </Card>
  );
}
