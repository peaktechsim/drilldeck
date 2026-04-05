import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { PistolIcon, RifleIcon } from "@/components/weapon-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UspsaTarget from "@/components/uspsa-target";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { type CreateDrillInput, type Drill, api } from "@/lib/api";

const zoneOrder = ["A", "B", "C", "D"] as const;
const weaponOptions = [
  { value: "pistol", label: "Pistol", Icon: PistolIcon },
  { value: "rifle", label: "Rifle", Icon: RifleIcon },
] as const;

const zoneBadgeClasses: Record<(typeof zoneOrder)[number], string> = {
  A: "border-red-200 bg-red-500/10 text-red-700",
  B: "border-orange-200 bg-orange-500/10 text-orange-700",
  C: "border-yellow-200 bg-yellow-500/15 text-yellow-800",
  D: "border-blue-200 bg-blue-500/10 text-blue-700",
};

function getDrillWeapons(drill: Pick<Drill, "weapons">) {
  const weapons = drill.weapons?.length ? drill.weapons : ["pistol"];
  return weaponOptions.filter((option) => weapons.includes(option.value));
}

type DrillFormValues = {
  name: string;
  description: string;
  timeStandard: string;
  distance: string;
  targetZones: string[];
  weapons: string[];
};

function getInitialDrillFormValues(drill?: Drill): DrillFormValues {
  return {
    name: drill?.name ?? "",
    description: drill?.description ?? "",
    timeStandard: drill?.timeStandard ?? "",
    distance: drill?.distance ?? "7",
    targetZones: drill?.targetZones ?? [],
    weapons: drill?.weapons?.length ? drill.weapons : ["pistol"],
  };
}

type DrillFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  initialValues?: Drill;
  isPending: boolean;
  submitError?: string | null;
  onSubmit: (values: CreateDrillInput) => void;
};

function DrillFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  pendingLabel,
  initialValues,
  isPending,
  submitError,
  onSubmit,
}: DrillFormDialogProps) {
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [timeStandard, setTimeStandard] = useState("");
  const [distance, setDistance] = useState("7");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>(["pistol"]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextValues = getInitialDrillFormValues(initialValues);
    setName(nextValues.name);
    setDetails(nextValues.description);
    setTimeStandard(nextValues.timeStandard);
    setDistance(nextValues.distance);
    setSelectedZones(nextValues.targetZones);
    setSelectedWeapons(nextValues.weapons);
    setFormError(null);
  }, [initialValues, open]);

  const selectedZoneText = useMemo(
    () => (selectedZones.length ? selectedZones.join(", ") : "No target zones selected yet."),
    [selectedZones],
  );

  const selectedWeaponText = useMemo(
    () =>
      selectedWeapons.length
        ? selectedWeapons.map((weapon) => weapon[0].toUpperCase() + weapon.slice(1)).join(", ")
        : "Select at least one weapon.",
    [selectedWeapons],
  );

  function toggleZone(zone: string) {
    setSelectedZones((current) =>
      current.includes(zone)
        ? current.filter((entry) => entry !== zone)
        : [...current, zone].sort(),
    );
  }

  function toggleWeapon(weapon: string) {
    setSelectedWeapons((current) =>
      current.includes(weapon)
        ? current.filter((entry) => entry !== weapon)
        : [...current, weapon].sort(),
    );
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setFormError(null);
    }

    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!selectedZones.length) {
      setFormError("Select at least one target zone.");
      return;
    }

    if (!selectedWeapons.length) {
      setFormError("Select at least one weapon.");
      return;
    }

    onSubmit({
      name: name.trim(),
      description: details.trim(),
      timeStandard,
      distance,
      targetZones: selectedZones,
      weapons: selectedWeapons,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="drill-name">Name</Label>
            <Input
              id="drill-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Bill Drill"
              className="h-10 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="drill-description">Description</Label>
            <textarea
              id="drill-description"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Six rounds from the draw at seven yards"
              className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="drill-time-standard">Time standard (seconds)</Label>
            <Input
              id="drill-time-standard"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={timeStandard}
              onChange={(event) => setTimeStandard(event.target.value)}
              placeholder="2.5"
              className="h-10 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="drill-distance">Distance (yards)</Label>
            <Input
              id="drill-distance"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              placeholder="7"
              className="h-10 text-sm"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Weapons</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {weaponOptions.map(({ value, label, Icon }) => {
                const checked = selectedWeapons.includes(value);

                return (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border bg-muted/10 px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleWeapon(value)}
                      aria-label={label}
                    />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">{selectedWeaponText}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
            <div className="space-y-3">
              <Label>Zone picker</Label>
              <div className="rounded-xl border bg-muted/10 p-4">
                <UspsaTarget
                  selectedZones={selectedZones}
                  onToggleZone={toggleZone}
                  interactive
                  className="flex justify-center"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Tap the silhouette zones or use the checkboxes below.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Selected zones</Label>
              <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
                {zoneOrder.map((zone) => {
                  const checked = selectedZones.includes(zone);

                  return (
                    <div key={zone} className="flex items-center gap-3 text-sm font-medium">
                      <Checkbox checked={checked} onCheckedChange={() => toggleZone(zone)} />
                      <span>Zone {zone}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">{selectedZoneText}</p>
            </div>
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="ghost" className="h-10 text-sm" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="h-10 text-sm" disabled={isPending}>
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DrillsPage() {
  const queryClient = useQueryClient();
  const { shooter } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);

  const drillsQuery = useQuery({
    queryKey: ["drills"],
    queryFn: api.listDrills,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateDrillInput) => api.createDrill(input),
    onSuccess: () => {
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["drills"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: CreateDrillInput }) => api.updateDrill(id, input),
    onSuccess: () => {
      setEditingDrill(null);
      void queryClient.invalidateQueries({ queryKey: ["drills"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Drills</h1>
          <p className="text-sm text-muted-foreground">
            Review available drills, time standards, and USPSA scoring emphasis.
          </p>
        </div>

        {shooter?.isAdmin ? (
          <>
            <Button type="button" className="h-10 px-4 text-sm" onClick={() => setCreateOpen(true)}>
              Create Drill
            </Button>
            <DrillFormDialog
              open={createOpen}
              onOpenChange={(nextOpen) => {
                setCreateOpen(nextOpen);
                if (!nextOpen) {
                  createMutation.reset();
                }
              }}
              title="Create drill"
              description="Set the drill details and choose the USPSA target zones to emphasize."
              submitLabel="Save drill"
              pendingLabel="Creating…"
              isPending={createMutation.isPending}
              submitError={
                createMutation.error instanceof Error ? createMutation.error.message : null
              }
              onSubmit={(input) => createMutation.mutate(input)}
            />
          </>
        ) : null}
      </div>

      {drillsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading drills…</p> : null}

      {drillsQuery.error ? (
        <p className="text-sm text-destructive">
          {drillsQuery.error instanceof Error
            ? drillsQuery.error.message
            : "Unable to load drills."}
        </p>
      ) : null}

      <div className="grid gap-6">
        {drillsQuery.data?.map((drill) => {
          const drillWeapons = getDrillWeapons(drill);

          return (
            <Card key={drill.id} className="overflow-hidden py-0">
              <CardContent className="relative grid min-h-[26rem] gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)] lg:items-stretch">
                {shooter?.isAdmin ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => setEditingDrill(drill)}
                    aria-label={`Edit ${drill.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}

                <div className="flex h-full flex-col justify-between gap-8">
                  <div className="space-y-4 pr-10">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                      {drill.name}
                    </h2>
                    <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                      {drill.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <Badge
                      variant="secondary"
                      className="rounded-full px-4 py-2 text-2xl font-bold leading-none"
                    >
                      {drill.timeStandard}s
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-full px-4 py-2 text-xl font-semibold leading-none"
                    >
                      {drill.distance} yards
                    </Badge>
                    {drill.targetZones.length ? (
                      drill.targetZones.map((zone) => (
                        <Badge
                          key={zone}
                          variant="outline"
                          className={cn(
                            "rounded-full px-4 py-2 text-lg font-semibold",
                            zoneBadgeClasses[zone as keyof typeof zoneBadgeClasses],
                          )}
                        >
                          Zone <span className="ml-1 text-xl font-bold">{zone}</span>
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="rounded-full px-4 py-2 text-lg font-semibold">
                        No zones
                      </Badge>
                    )}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      {drillWeapons.map(({ value, label, Icon }) => (
                        <span
                          key={value}
                          className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-foreground"
                          aria-label={label}
                          title={label}
                        >
                          <Icon className="h-8 w-8" aria-hidden="true" />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex h-full items-center justify-center rounded-xl border bg-muted/10 p-4 sm:p-6">
                  <UspsaTarget selectedZones={drill.targetZones} className="flex h-full w-full justify-center" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {shooter?.isAdmin ? (
        <DrillFormDialog
          open={editingDrill !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setEditingDrill(null);
              updateMutation.reset();
            }
          }}
          title={editingDrill ? `Edit ${editingDrill.name}` : "Edit drill"}
          description="Update the drill details and choose the USPSA target zones to emphasize."
          submitLabel="Save changes"
          pendingLabel="Saving…"
          initialValues={editingDrill ?? undefined}
          isPending={updateMutation.isPending}
          submitError={updateMutation.error instanceof Error ? updateMutation.error.message : null}
          onSubmit={(input) => {
            if (!editingDrill) {
              return;
            }

            updateMutation.mutate({ id: editingDrill.id, input });
          }}
        />
      ) : null}
    </div>
  );
}
