import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { api, Drill, ShooterSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

export type AuthedShooter = ShooterSummary & { pin: string };
export type SelectedDrill = Drill;
export type DrillOrder = "manual" | "random";

export type SessionConfig = {
  sessionId: number;
  shooters: AuthedShooter[];
  drills: SelectedDrill[];
  drillOrder: DrillOrder;
};

type SessionSetupProps = {
  onBegin: (config: SessionConfig) => void;
};

const MAX_PIN_ATTEMPTS = 5;

function wait(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

export default function SessionSetup({ onBegin }: SessionSetupProps) {
  const { shooter } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedShooter, setSelectedShooter] = useState<ShooterSummary | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [verifiedShooters, setVerifiedShooters] = useState<AuthedShooter[]>([]);
  const [selectedDrillIds, setSelectedDrillIds] = useState<number[]>([]);
  const [drillOrder, setDrillOrder] = useState<DrillOrder>("manual");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);

  const shootersQuery = useQuery({
    queryKey: ["shooters"],
    queryFn: api.listShooters,
  });

  const drillsQuery = useQuery({
    queryKey: ["drills"],
    queryFn: api.listDrills,
  });

  const filteredShooters = useMemo(() => {
    const term = search.trim().toLowerCase();
    const verifiedIds = new Set(verifiedShooters.map((entry) => entry.id));

    return (shootersQuery.data ?? []).filter((entry) => {
      if (verifiedIds.has(entry.id)) {
        return false;
      }

      if (!term) {
        return true;
      }

      return entry.name.toLowerCase().includes(term) || entry.email.toLowerCase().includes(term);
    });
  }, [search, shootersQuery.data, verifiedShooters]);

  const selectedDrills = useMemo(
    () => (drillsQuery.data ?? []).filter((drill) => selectedDrillIds.includes(drill.id)),
    [drillsQuery.data, selectedDrillIds],
  );

  async function handleVerifyShooter() {
    if (!selectedShooter) {
      return;
    }

    const currentAttempts = attempts[selectedShooter.id] ?? 0;
    if (currentAttempts >= MAX_PIN_ATTEMPTS) {
      setPinError("This shooter is locked out after too many failed PIN attempts.");
      return;
    }

    setPinError(null);

    try {
      const verified = await api.verifyPin({ email: selectedShooter.email, pin });
      setVerifiedShooters((current) => [
        ...current,
        { id: verified.id, name: verified.name, email: verified.email, pin },
      ]);
      setSelectedShooter(null);
      setPin("");
    } catch (error) {
      const nextAttempts = currentAttempts + 1;
      setAttempts((current) => ({ ...current, [selectedShooter.id]: nextAttempts }));
      setPinError(
        error instanceof Error
          ? error.message
          : nextAttempts >= MAX_PIN_ATTEMPTS
            ? "This shooter is locked out after too many failed PIN attempts."
            : "Incorrect PIN.",
      );
    }
  }

  function handleSelectShooter(nextShooter: ShooterSummary) {
    setSelectedShooter(nextShooter);
    setPin("");
    setPinError(null);
  }

  function removeShooter(shooterId: number) {
    setVerifiedShooters((current) => current.filter((entry) => entry.id !== shooterId));
    if (selectedShooter?.id === shooterId) {
      setSelectedShooter(null);
      setPin("");
      setPinError(null);
    }
  }

  function toggleDrill(drillId: number) {
    setSelectedDrillIds((current) =>
      current.includes(drillId)
        ? current.filter((entry) => entry !== drillId)
        : [...current, drillId],
    );
  }

  async function handleBegin() {
    if (!shooter) {
      setSubmitError("You must be logged in to start a session.");
      return;
    }

    if (!verifiedShooters.length) {
      setSubmitError("Add at least one shooter to begin.");
      return;
    }

    if (!selectedDrills.length) {
      setSubmitError("Select at least one drill.");
      return;
    }

    setIsSubmitting(true);
    setIsTransitioningOut(true);
    setSubmitError(null);

    try {
      const session = await api.createSession({ createdBy: shooter.id, drillOrder });

      for (const [index, authedShooter] of verifiedShooters.entries()) {
        await api.addSessionShooter(session.id, {
          email: authedShooter.email,
          pin: authedShooter.pin,
          position: index + 1,
        });
      }

      await api.setSessionDrills(session.id, {
        drillIds: selectedDrills.map((entry) => entry.id),
      });

      await wait(180);

      onBegin({
        sessionId: session.id,
        shooters: verifiedShooters,
        drills: selectedDrills,
        drillOrder,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to start session.");
      setIsTransitioningOut(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "grid gap-6 transition-all duration-300 lg:grid-cols-[1.15fr_0.85fr]",
        isTransitioningOut && "translate-y-2 opacity-0",
      )}
    >
      <Card>
        <CardHeader>
          <CardTitle>Session setup</CardTitle>
          <CardDescription>
            Search registered shooters, verify their PINs, and build your firing line.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="shooter-search">Find shooter</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="shooter-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="h-12 pl-10 text-base"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/10 p-3">
            {shootersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading shooters…</p>
            ) : null}
            {shootersQuery.error ? (
              <p className="text-sm text-destructive">
                {shootersQuery.error instanceof Error
                  ? shootersQuery.error.message
                  : "Unable to load shooters."}
              </p>
            ) : null}

            {filteredShooters.length ? (
              filteredShooters.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => handleSelectShooter(entry)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                    selectedShooter?.id === entry.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40 hover:bg-accent/40",
                  )}
                >
                  <div>
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">{entry.email}</p>
                  </div>
                  <UserPlus className="size-4 text-muted-foreground" />
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No unverified shooters match that search.
              </p>
            )}
          </div>

          {selectedShooter ? (
            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <p className="font-medium">Verify {selectedShooter.name}</p>
                <p className="text-sm text-muted-foreground">
                  Enter PIN to add this shooter to the session.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="join-pin">PIN</Label>
                  <Input
                    id="join-pin"
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    className="h-12 text-base"
                    placeholder="••••"
                  />
                </div>
                <Button
                  type="button"
                  className="h-12 px-6 text-base"
                  onClick={() => void handleVerifyShooter()}
                >
                  Add shooter
                </Button>
              </div>
              {pinError ? <p className="text-sm text-destructive">{pinError}</p> : null}
              <p className="text-xs text-muted-foreground">
                Failed attempts: {attempts[selectedShooter.id] ?? 0}/{MAX_PIN_ATTEMPTS}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Verified shooters</CardTitle>
            <CardDescription>These shooters are ready to be added to the session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {verifiedShooters.length ? (
              verifiedShooters.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border bg-background px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {index + 1}. {entry.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeShooter(entry.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No verified shooters yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drills</CardTitle>
            <CardDescription>
              Select one or more drills and choose how they should run.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {(drillsQuery.data ?? []).map((drill) => {
                const checked = selectedDrillIds.includes(drill.id);

                return (
                  <div
                    key={drill.id}
                    className="flex items-start gap-3 rounded-xl border bg-background px-4 py-3"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleDrill(drill.id)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <p className="font-medium">{drill.name}</p>
                      <p className="text-sm text-muted-foreground">{drill.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Time standard: {drill.timeStandard}s
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <Label>Drill order</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      value: "manual",
                      title: "Manual",
                      description: "Run drills in the list order shown above.",
                    },
                    {
                      value: "random",
                      title: "Random",
                      description: "Shuffle the selected drills once when the session begins.",
                    },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDrillOrder(option.value)}
                    className={cn(
                      "rounded-xl border px-4 py-4 text-left transition-colors",
                      drillOrder === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:border-primary/40 hover:bg-accent/40",
                    )}
                  >
                    <p className="font-medium">{option.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

            <Button
              type="button"
              className="h-12 w-full text-base"
              onClick={() => void handleBegin()}
              disabled={isSubmitting}
            >
              <ArrowRight className="size-4" />
              {isSubmitting ? "Starting session…" : "Begin training"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
