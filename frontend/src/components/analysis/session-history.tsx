import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DrillAnalysis } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildSessionHistory, formatSeconds } from "@/components/analysis/utils";
import { cn } from "@/lib/utils";

export function SessionHistory({ drills }: { drills: DrillAnalysis[] }) {
  const sessions = useMemo(() => buildSessionHistory(drills), [drills]);
  const [openSessions, setOpenSessions] = useState<number[]>([]);

  function toggleSession(sessionId: number) {
    setOpenSessions((current) =>
      current.includes(sessionId) ? current.filter((entry) => entry !== sessionId) : [...current, sessionId],
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session history</CardTitle>
        <CardDescription>Newest sessions first. Expand a row to inspect individual attempts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Date</TableHead>
              <TableHead>Drills run</TableHead>
              <TableHead>Pass / Fail</TableHead>
              <TableHead>Best</TableHead>
              <TableHead>Worst</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const expanded = openSessions.includes(session.sessionId);

              return (
                <Fragment key={session.sessionId}>
                  <TableRow aria-expanded={expanded} className="cursor-pointer" onClick={() => toggleSession(session.sessionId)}>
                    <TableCell>
                      {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{new Date(session.sessionStartedAt).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.sessionStartedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {session.drillNames.map((drillName) => (
                          <Badge key={`${session.sessionId}-${drillName}`} variant="outline">
                            {drillName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white">{session.passCount} pass</Badge>
                        <Badge variant="destructive">{session.failCount} fail</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formatSeconds(session.bestTime)}</TableCell>
                    <TableCell>{formatSeconds(session.worstTime)}</TableCell>
                  </TableRow>

                  {expanded ? (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/20 p-0">
                        <div className="px-4 py-4">
                          <div className="mb-3 grid grid-cols-[minmax(0,1.5fr)_100px_80px_120px] gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <span>Entry</span>
                            <span>Time</span>
                            <span>Result</span>
                            <span>Recorded</span>
                          </div>
                          <div className="space-y-2">
                            {session.entries.map((entry) => (
                              <div
                                key={entry.id}
                                className={cn(
                                  "grid grid-cols-[minmax(0,1.5fr)_100px_80px_120px] gap-3 rounded-lg border px-3 py-2 text-sm",
                                  entry.pass ? "border-emerald-200 bg-emerald-50/60" : "border-red-200 bg-red-50/60",
                                )}
                              >
                                <div>
                                  <p className="font-medium">{entry.drillName}</p>
                                  <p className="text-xs text-muted-foreground">Attempt #{entry.id}</p>
                                </div>
                                <span>{formatSeconds(entry.timeEntered)}</span>
                                <Badge className={entry.pass ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}>
                                  {entry.pass ? "Pass" : "Fail"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(entry.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default SessionHistory;
