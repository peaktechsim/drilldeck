import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import UspsaTarget from "@/components/uspsa-target";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type SessionEntry } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SessionConfig } from "./session-setup";

export type Entry = {
  shooterId: number;
  shooterName: string;
  drillId: number;
  drillName: string;
  timeEntered: number;
  pass: boolean;
};

export type DrillFlowResult = {
  sessionId: number;
  entries: Entry[];
};

type DrillFlowProps = {
  config: SessionConfig;
  onComplete: (result: DrillFlowResult) => void;
};

type FlowPhase = "shooter-splash" | "drill-card" | "transitioning";

function shuffleItems<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function toDisplayEntry(entry: SessionEntry, config: SessionConfig): Entry | null {
  const shooter = config.shooters.find((item) => item.id === entry.shooterId);
  const drill = config.drills.find((item) => item.id === entry.drillId);

  if (!shooter || !drill) {
    return null;
  }

  return {
    shooterId: entry.shooterId,
    shooterName: shooter.name,
    drillId: entry.drillId,
    drillName: drill.name,
    timeEntered: Number(entry.timeEntered),
    pass: entry.pass,
  };
}

export default function DrillFlow({ config, onComplete }: DrillFlowProps) {
  const drills = useMemo(
    () => (config.drillOrder === "random" ? shuffleItems(config.drills) : config.drills),
    [config.drillOrder, config.drills],
  );

  const [drillIndex, setDrillIndex] = useState(0);
  const [shooterIndex, setShooterIndex] = useState(0);
  const [phase, setPhase] = useState<FlowPhase>("shooter-splash");
  const [timeValue, setTimeValue] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const activeDrill = drills[drillIndex];
  const activeShooter = config.shooters[shooterIndex];

  useEffect(() => {
    if (phase !== "shooter-splash") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setPhase("drill-card");
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [phase, drillIndex, shooterIndex]);

  useEffect(() => {
    if (!completed) {
      return;
    }

    onComplete({ sessionId: config.sessionId, entries });
  }, [completed, config.sessionId, entries, onComplete]);

  if (!activeDrill || !activeShooter) {
    return null;
  }

  const roundNumber = drillIndex * config.shooters.length + shooterIndex + 1;
  const totalRounds = drills.length * config.shooters.length;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTime = Number(timeValue);
    if (!Number.isFinite(normalizedTime) || normalizedTime <= 0) {
      setError("Enter a valid time to continue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPhase("transitioning");

    try {
      const savedEntry = await api.recordSessionEntry(config.sessionId, {
        shooterId: activeShooter.id,
        drillId: activeDrill.id,
        timeEntered: normalizedTime.toFixed(2),
      });

      const displayEntry = toDisplayEntry(savedEntry, config);
      if (displayEntry) {
        setEntries((current) => [...current, displayEntry]);
      }

      const isLastShooter = shooterIndex === config.shooters.length - 1;
      const isLastDrill = drillIndex === drills.length - 1;

      if (isLastShooter && isLastDrill) {
        await api.completeSession(config.sessionId);
        setCompleted(true);
        return;
      }

      if (isLastShooter) {
        setDrillIndex((current) => current + 1);
        setShooterIndex(0);
      } else {
        setShooterIndex((current) => current + 1);
      }

      setTimeValue("");
      setPhase("shooter-splash");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this entry.");
      setPhase("drill-card");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      {phase === "shooter-splash" ? (
        <div className="flex min-h-[65vh] flex-col items-center justify-center rounded-3xl border bg-card px-6 text-center shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Up Next</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">{activeShooter.name}</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Drill {drillIndex + 1} of {drills.length}: {activeDrill.name}
          </p>
        </div>
      ) : (
        <Card className={cn("animate-in fade-in slide-in-from-right-4 duration-300", phase === "transitioning" && "opacity-70")}>
          <CardHeader>
            <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{activeDrill.name}</span>
              <span className="text-sm font-medium text-muted-foreground">
                Shooter {shooterIndex + 1}/{config.shooters.length}
              </span>
            </CardTitle>
            <CardDescription>
              {activeDrill.description} • Standard {activeDrill.timeStandard}s • Entry {roundNumber}/{totalRounds}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-4 rounded-2xl border bg-muted/10 p-5">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Shooter</p>
                <p className="text-3xl font-semibold tracking-tight">{activeShooter.name}</p>
              </div>

              <div className="rounded-2xl border bg-background p-4">
                <UspsaTarget selectedZones={activeDrill.targetZones} className="flex justify-center" />
              </div>
            </div>

            <form className="space-y-4 rounded-2xl border bg-background p-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="time-entered">Time entered (seconds)</Label>
                <Input
                  id="time-entered"
                  type="number"
                  step="0.01"
                  min="0"
                  autoFocus
                  inputMode="decimal"
                  value={timeValue}
                  onChange={(event) => setTimeValue(event.target.value)}
                  className="h-16 text-3xl font-semibold"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>

              <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Pass requires {activeDrill.timeStandard}s or faster.
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="h-14 w-full text-lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save time"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
