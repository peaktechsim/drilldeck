import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

export default function ShootersPage() {
  const queryClient = useQueryClient();
  const { shooter, login } = useAuth();
  const [name, setName] = useState(shooter?.name ?? "");
  const [rifle, setRifle] = useState(shooter?.rifle ?? "");
  const [pistol, setPistol] = useState(shooter?.pistol ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const shooterQuery = useQuery({
    queryKey: ["shooter", shooter?.id],
    queryFn: () => api.getShooter(shooter!.id),
    enabled: Boolean(shooter),
  });

  const shootersQuery = useQuery({
    queryKey: ["shooters"],
    queryFn: api.listShooters,
    enabled: Boolean(shooter?.isAdmin),
  });

  useEffect(() => {
    if (!shooterQuery.data) {
      return;
    }

    setName(shooterQuery.data.name ?? "");
    setRifle(shooterQuery.data.rifle ?? "");
    setPistol(shooterQuery.data.pistol ?? "");
  }, [shooterQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateShooter(shooter!.id, {
        name: name.trim(),
        rifle: rifle.trim() || null,
        pistol: pistol.trim() || null,
      }),
    onSuccess: (updatedShooter) => {
      login(updatedShooter);
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ["shooter", shooter?.id] });
      void queryClient.invalidateQueries({ queryKey: ["shooters"] });
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Unable to update shooter profile.");
    },
  });

  if (!shooter) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    updateMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{shooter.isAdmin ? "Shooter profile" : "Your shooter profile"}</CardTitle>
          <CardDescription>
            Update the name and firearm details used during training sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="shooter-name">Name</Label>
                <Input
                  id="shooter-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Shooter name"
                  className="h-12 text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shooter-rifle">Rifle</Label>
                <Input
                  id="shooter-rifle"
                  value={rifle}
                  onChange={(event) => setRifle(event.target.value)}
                  placeholder="Optional"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shooter-pistol">Pistol</Label>
                <Input
                  id="shooter-pistol"
                  value={pistol}
                  onChange={(event) => setPistol(event.target.value)}
                  placeholder="Optional"
                  className="h-12 text-base"
                />
              </div>
            </div>

            {shooterQuery.error ? (
              <p className="text-sm text-destructive">
                {shooterQuery.error instanceof Error
                  ? shooterQuery.error.message
                  : "Unable to load your profile."}
              </p>
            ) : null}

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <Button
              type="submit"
              className="h-12 text-base"
              disabled={updateMutation.isPending || shooterQuery.isLoading}
            >
              {updateMutation.isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {shooter.isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>All shooters</CardTitle>
            <CardDescription>Admin view of registered shooters in the system.</CardDescription>
          </CardHeader>
          <CardContent>
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

            {shootersQuery.data?.length ? (
              <div className="space-y-3">
                {shootersQuery.data.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-1 rounded-lg border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-sm text-muted-foreground">{entry.email}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
