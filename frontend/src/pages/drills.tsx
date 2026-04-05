import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import { PistolIcon, RifleIcon } from "@/components/weapon-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UspsaTarget from "@/components/uspsa-target";
import { useAuth } from "@/context/auth-context";
import { type Drill, api } from "@/lib/api";

const zoneOrder = ["A", "B", "C", "D"] as const;
const weaponOptions = [
  { value: "pistol", label: "Pistol", Icon: PistolIcon },
  { value: "rifle", label: "Rifle", Icon: RifleIcon },
] as const;

function getDrillWeapons(drill: Pick<Drill, "weapons">) {
  const weapons = drill.weapons?.length ? drill.weapons : ["pistol"];
  return weaponOptions.filter((option) => weapons.includes(option.value));
}

export default function DrillsPage() {
  const queryClient = useQueryClient();
  const { shooter } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeStandard, setTimeStandard] = useState("");
  const [distance, setDistance] = useState("7");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>(["pistol"]);
  const [formError, setFormError] = useState<string | null>(null);

  const drillsQuery = useQuery({
    queryKey: ["drills"],
    queryFn: api.listDrills,
  });

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

  function resetForm() {
    setName("");
    setDescription("");
    setTimeStandard("");
    setDistance("7");
    setSelectedZones([]);
    setSelectedWeapons(["pistol"]);
    setFormError(null);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      api.createDrill({
        name: name.trim(),
        description: description.trim(),
        timeStandard,
        distance,
        targetZones: selectedZones,
        weapons: selectedWeapons,
      }),
    onSuccess: () => {
      resetForm();
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["drills"] });
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Unable to create drill.");
    },
  });

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

    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Drills</h1>
          <p className="text-sm text-muted-foreground">
            Review available drills and their USPSA scoring zones.
          </p>
        </div>

        {shooter?.isAdmin ? (
          <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (!nextOpen) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button type="button" className="h-12 px-5 text-base">
                Create Drill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create drill</DialogTitle>
                <DialogDescription>
                  Set the drill details and choose the USPSA target zones to emphasize.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="drill-name">Name</Label>
                  <Input
                    id="drill-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Bill Drill"
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drill-description">Description</Label>
                  <Input
                    id="drill-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Six rounds from the draw at seven yards"
                    className="h-12 text-base"
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
                    className="h-12 text-base"
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
                    className="h-12 text-base"
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

                <DialogFooter>
                  <Button
                    type="submit"
                    className="h-12 text-base"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating…" : "Save drill"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {drillsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading drills…</p>
      ) : null}

      {drillsQuery.error ? (
        <p className="text-sm text-destructive">
          {drillsQuery.error instanceof Error
            ? drillsQuery.error.message
            : "Unable to load drills."}
        </p>
      ) : null}

      <div className="grid gap-5">
        {drillsQuery.data?.map((drill) => {
          const drillWeapons = getDrillWeapons(drill);

          return (
            <Card key={drill.id}>
              <CardHeader>
                <CardTitle>{drill.name}</CardTitle>
                <CardDescription>{drill.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">Time standard:</span>{" "}
                      {drill.timeStandard}s
                    </span>
                    <span>
                      <span className="font-medium text-foreground">Distance:</span>{" "}
                      {drill.distance} yards
                    </span>
                    <span>
                      <span className="font-medium text-foreground">Target zones:</span>{" "}
                      {drill.targetZones.length ? drill.targetZones.join(", ") : "None"}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Weapons:</span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        {drillWeapons.map(({ value, label, Icon }) => (
                          <Icon key={value} className="h-5 w-5" aria-label={label} />
                        ))}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/10 p-4">
                  <UspsaTarget selectedZones={drill.targetZones} className="flex justify-center" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
