import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import UspsaTarget from "@/components/uspsa-target";
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
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

const zoneOrder = ["A", "B", "C", "D"] as const;

export default function DrillsPage() {
  const queryClient = useQueryClient();
  const { shooter } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeStandard, setTimeStandard] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const drillsQuery = useQuery({
    queryKey: ["drills"],
    queryFn: api.listDrills,
  });

  const selectedZoneText = useMemo(
    () => (selectedZones.length ? selectedZones.join(", ") : "No target zones selected yet."),
    [selectedZones],
  );

  function toggleZone(zone: string) {
    setSelectedZones((current) =>
      current.includes(zone) ? current.filter((entry) => entry !== zone) : [...current, zone].sort(),
    );
  }

  function resetForm() {
    setName("");
    setDescription("");
    setTimeStandard("");
    setSelectedZones([]);
    setFormError(null);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      api.createDrill({
        name: name.trim(),
        description: description.trim(),
        timeStandard,
        targetZones: selectedZones,
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

    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Drills</h1>
          <p className="text-sm text-muted-foreground">Review available drills and their USPSA scoring zones.</p>
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
                <DialogDescription>Set the drill details and choose the USPSA target zones to emphasize.</DialogDescription>
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
                    <p className="text-sm text-muted-foreground">Tap the silhouette zones or use the checkboxes below.</p>
                  </div>

                  <div className="space-y-3">
                    <Label>Selected zones</Label>
                    <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
                      {zoneOrder.map((zone) => {
                        const checked = selectedZones.includes(zone);

                        return (
                          <label key={zone} className="flex items-center gap-3 text-sm font-medium">
                            <Checkbox checked={checked} onCheckedChange={() => toggleZone(zone)} />
                            <span>Zone {zone}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedZoneText}</p>
                  </div>
                </div>

                {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

                <DialogFooter>
                  <Button type="submit" className="h-12 text-base" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating…" : "Save drill"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {drillsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading drills…</p> : null}

      {drillsQuery.error ? (
        <p className="text-sm text-destructive">
          {drillsQuery.error instanceof Error ? drillsQuery.error.message : "Unable to load drills."}
        </p>
      ) : null}

      <div className="grid gap-5">
        {drillsQuery.data?.map((drill) => (
          <Card key={drill.id}>
            <CardHeader>
              <CardTitle>{drill.name}</CardTitle>
              <CardDescription>{drill.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Time standard:</span> {drill.timeStandard}s
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Target zones:</span>{" "}
                  {drill.targetZones.length ? drill.targetZones.join(", ") : "None"}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/10 p-4">
                <UspsaTarget selectedZones={drill.targetZones} className="flex justify-center" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
