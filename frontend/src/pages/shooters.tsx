import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingRifle, setEditingRifle] = useState("");
  const [editingPistol, setEditingPistol] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);

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

  const editingShooterQuery = useQuery({
    queryKey: ["shooter", editingId],
    queryFn: () => api.getShooter(editingId!),
    enabled: editingId !== null,
  });

  useEffect(() => {
    if (!shooterQuery.data) {
      return;
    }

    setName(shooterQuery.data.name ?? "");
    setRifle(shooterQuery.data.rifle ?? "");
    setPistol(shooterQuery.data.pistol ?? "");
  }, [shooterQuery.data]);

  useEffect(() => {
    if (!editingShooterQuery.data || editingId === null) {
      return;
    }

    setEditingName(editingShooterQuery.data.name ?? "");
    setEditingRifle(editingShooterQuery.data.rifle ?? "");
    setEditingPistol(editingShooterQuery.data.pistol ?? "");
    setEditingError(null);
  }, [editingId, editingShooterQuery.data]);

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

  const adminUpdateMutation = useMutation({
    mutationFn: ({ id, nextName, nextRifle, nextPistol }: {
      id: number;
      nextName: string;
      nextRifle: string;
      nextPistol: string;
    }) =>
      api.updateShooter(id, {
        name: nextName.trim(),
        rifle: nextRifle.trim() || null,
        pistol: nextPistol.trim() || null,
      }),
    onSuccess: async (_, variables) => {
      setEditingError(null);
      setEditingId(null);
      setEditingName("");
      setEditingRifle("");
      setEditingPistol("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["shooters"] }),
        queryClient.invalidateQueries({ queryKey: ["shooter", variables.id] }),
      ]);
    },
    onError: (error) => {
      setEditingError(error instanceof Error ? error.message : "Unable to update shooter profile.");
    },
  });

  if (!shooter) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    updateMutation.mutate();
  }

  function handleEditStart(id: number) {
    setEditingId(id);
    setEditingName("");
    setEditingRifle("");
    setEditingPistol("");
    setEditingError(null);
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditingName("");
    setEditingRifle("");
    setEditingPistol("");
    setEditingError(null);
  }

  function handleAdminSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingId === null) {
      return;
    }

    setEditingError(null);
    adminUpdateMutation.mutate({
      id: editingId,
      nextName: editingName,
      nextRifle: editingRifle,
      nextPistol: editingPistol,
    });
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
                {shootersQuery.data.map((entry) => {
                  const isEditing = editingId === entry.id;
                  const isLoadingEdit = isEditing && editingShooterQuery.isLoading;
                  const isSavingEdit = isEditing && adminUpdateMutation.isPending;

                  return (
                    <div
                      key={entry.id}
                      className="rounded-lg border bg-muted/20 px-4 py-3 transition-all"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{entry.name}</p>
                          <p className="text-sm text-muted-foreground">{entry.email}</p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 self-start sm:self-center"
                          onClick={() => handleEditStart(entry.id)}
                          disabled={adminUpdateMutation.isPending || editingShooterQuery.isLoading}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </div>

                      {isEditing ? (
                        <form
                          className="animate-in fade-in slide-in-from-top-2 mt-4 space-y-4 duration-200 border-t pt-4"
                          onSubmit={handleAdminSave}
                        >
                          {isLoadingEdit ? (
                            <p className="text-sm text-muted-foreground">Loading shooter details…</p>
                          ) : (
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`edit-name-${entry.id}`}>Name</Label>
                                <Input
                                  id={`edit-name-${entry.id}`}
                                  value={editingName}
                                  onChange={(event) => setEditingName(event.target.value)}
                                  placeholder="Shooter name"
                                  className="h-10 text-sm"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`edit-rifle-${entry.id}`}>Rifle</Label>
                                <Input
                                  id={`edit-rifle-${entry.id}`}
                                  value={editingRifle}
                                  onChange={(event) => setEditingRifle(event.target.value)}
                                  placeholder="Optional"
                                  className="h-10 text-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`edit-pistol-${entry.id}`}>Pistol</Label>
                                <Input
                                  id={`edit-pistol-${entry.id}`}
                                  value={editingPistol}
                                  onChange={(event) => setEditingPistol(event.target.value)}
                                  placeholder="Optional"
                                  className="h-10 text-sm"
                                />
                              </div>
                            </div>
                          )}

                          {editingShooterQuery.error ? (
                            <p className="text-sm text-destructive">
                              {editingShooterQuery.error instanceof Error
                                ? editingShooterQuery.error.message
                                : "Unable to load shooter details."}
                            </p>
                          ) : null}

                          {editingError ? (
                            <p className="text-sm text-destructive">{editingError}</p>
                          ) : null}

                          <div className="flex items-center gap-2">
                            <Button
                              type="submit"
                              className="h-9"
                              disabled={isLoadingEdit || isSavingEdit || Boolean(editingShooterQuery.error)}
                            >
                              {isSavingEdit ? "Saving…" : "Save"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-9"
                              onClick={handleEditCancel}
                              disabled={isSavingEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
