import { Check, LoaderCircle, X, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UspsaTarget from "@/components/uspsa-target";
import { PistolIcon, RifleIcon } from "@/components/weapon-icons";
import { api, SessionEntry } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SessionConfig } from "./session-setup";

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
  onExit: () => void;
};

type FlowPhase = "shooter-splash" | "drill-card" | "transitioning";
type TransitionFeedback = "pass" | "fail" | null;

const zoneStyles: Record<string, string> = {
  A: "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300",
  B: "bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300",
  C: "bg-yellow-500/15 text-yellow-700 ring-yellow-500/30 dark:text-yellow-300",
  D: "bg-blue-500/15 text-blue-700 ring-blue-500/30 dark:text-blue-300",
};

const weaponOptions = [
  { value: "pistol", label: "Pistol", Icon: PistolIcon },
  { value: "rifle", label: "Rifle", Icon: RifleIcon },
] as const;

function getDrillWeapons(weapons: string[]) {
  const normalizedWeapons = weapons.length ? weapons : ["pistol"];
  return weaponOptions.filter((option) => normalizedWeapons.includes(option.value));
}

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

function wait(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

export default function DrillFlow({ config, onComplete, onExit }: DrillFlowProps) {
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
  const [transitionFeedback, setTransitionFeedback] = useState<TransitionFeedback>(null);

  const activeDrill = drills[drillIndex];
  const activeShooter = config.shooters[shooterIndex];
  const activeWeapons = useMemo(
    () => getDrillWeapons(activeDrill?.weapons ?? []),
    [activeDrill?.weapons],
  );

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
  const entryLabel = `Entry ${roundNumber} of ${totalRounds}`;

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
    setTransitionFeedback(null);

    try {
      const savedEntry = await api.recordSessionEntry(config.sessionId, {
        shooterId: activeShooter.id,
        drillId: activeDrill.id,
        timeEntered: normalizedTime.toFixed(2),
      });

      const displayEntry = toDisplayEntry(savedEntry, config);
      if (displayEntry) {
        setEntries((current) => [...current, displayEntry]);
        setTransitionFeedback(displayEntry.pass ? "pass" : "fail");
      }

      await wait(220);

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
      setTransitionFeedback(null);
      setPhase("shooter-splash");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this entry.");
      setTransitionFeedback(null);
      setPhase("drill-card");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-1 flex-col bg-background text-foreground">
      {phase === "shooter-splash" ? (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 px-6 text-center animate-in fade-in duration-300">
          <Badge variant="outline" className="px-4 py-1 text-xs uppercase tracking-[0.28em]">
            Up Next
          </Badge>
          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
            Auto-advancing to the line
          </div>
          <h1 className="mt-8 text-6xl font-bold tracking-tight sm:text-7xl">
            {activeShooter.name}
          </h1>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-lg text-muted-foreground sm:text-xl">
            <span>
              Drill {drillIndex + 1} of {drills.length}: {activeDrill.name}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {activeWeapons.map(({ value, label, Icon }) => (
                <Icon key={value} className="h-6 w-6" aria-label={label} />
              ))}
            </span>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {activeDrill.targetZones.length ? (
              activeDrill.targetZones.map((zone) => (
                <Badge
                  key={zone}
                  variant="outline"
                  className={cn("px-3 py-1 text-sm ring-1", zoneStyles[zone] ?? "")}
                >
                  Zone {zone}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="px-3 py-1 text-sm text-muted-foreground">
                No target zones selected
              </Badge>
            )}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {activeDrill.distance} yards • Standard {activeDrill.timeStandard}s • {entryLabel}
          </p>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20 animate-in fade-in duration-300">
          <div className="flex h-10 items-center justify-between gap-3 border-b border-border/50 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium">{activeDrill.name}</p>
              <span className="flex items-center gap-1 text-muted-foreground">
                {activeWeapons.map(({ value, label, Icon }) => (
                  <Icon key={value} className="h-5 w-5" aria-label={label} />
                ))}
              </span>
            </div>
            <Badge variant="outline" className="px-3 py-1 text-[11px] font-medium sm:text-xs">
              {entryLabel}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-sm text-muted-foreground"
              onClick={onExit}
            >
              <XIcon className="size-4" />
              Exit
            </Button>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
            <div
              className={cn(
                "relative flex w-full max-w-2xl flex-col items-center gap-6 rounded-[2rem] border border-border/60 bg-card/95 px-6 py-8 text-center shadow-xl shadow-black/5 backdrop-blur sm:px-10 sm:py-10",
                phase === "transitioning" && "opacity-90",
              )}
            >
              {transitionFeedback ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[2rem] bg-background/70 backdrop-blur-sm animate-in fade-in duration-150">
                  <div
                    className={cn(
                      "flex size-28 items-center justify-center rounded-full border shadow-lg",
                      transitionFeedback === "pass"
                        ? "border-green-500/40 bg-green-500/15 text-green-600 dark:text-green-300"
                        : "border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-300",
                    )}
                  >
                    {transitionFeedback === "pass" ? (
                      <Check className="size-14" />
                    ) : (
                      <X className="size-14" />
                    )}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-[0.22em]">
                  Shooter on deck
                </Badge>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {activeShooter.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground sm:text-base">
                  <span>
                    Drill {drillIndex + 1} of {drills.length} • {activeDrill.distance} yards • Standard {activeDrill.timeStandard}s
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {activeWeapons.map(({ value, label, Icon }) => (
                      <Icon key={value} className="h-5 w-5" aria-label={label} />
                    ))}
                  </span>
                </div>
              </div>

              <div className="w-full rounded-3xl border border-border/60 bg-background/80 px-6 py-5 shadow-sm">
                <UspsaTarget
                  selectedZones={activeDrill.targetZones}
                  className="mx-auto flex max-w-sm justify-center"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {activeDrill.targetZones.map((zone) => (
                  <Badge
                    key={zone}
                    variant="outline"
                    className={cn("px-3 py-1 text-sm ring-1", zoneStyles[zone] ?? "")}
                  >
                    Zone {zone}
                  </Badge>
                ))}
              </div>

              <form className="w-full space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2 text-left">
                  <Label htmlFor="time-entered" className="text-sm text-muted-foreground">
                    Time entered (seconds)
                  </Label>
                  <Input
                    id="time-entered"
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    inputMode="decimal"
                    value={timeValue}
                    onChange={(event) => setTimeValue(event.target.value)}
                    className="h-16 text-center text-3xl font-semibold tracking-tight"
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  {activeDrill.description}
                </div>

                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
