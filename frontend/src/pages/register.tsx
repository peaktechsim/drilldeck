import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

function normalizePin(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { shooter, login } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [rifle, setRifle] = useState("");
  const [pistol, setPistol] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (shooter) {
    return <Navigate to="/train" replace />;
  }

  function handlePinChange(setter: (value: string) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setter(normalizePin(event.target.value));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const registeredShooter = await api.register({
        email: email.trim(),
        name: name.trim(),
        pin,
        rifle: rifle.trim() || null,
        pistol: pistol.trim() || null,
      });
      login(registeredShooter);
      navigate("/train", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl">Create account</CardTitle>
          <CardDescription>Register a shooter profile for the current training day.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="shooter@example.com"
                  required
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="register-name">Name</Label>
                <Input
                  id="register-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jordan Lee"
                  required
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-pin">PIN</Label>
                <Input
                  id="register-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={pin}
                  onChange={handlePinChange(setPin)}
                  placeholder="••••"
                  required
                  className="h-12 text-base tracking-[0.35em]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-pin">Confirm PIN</Label>
                <Input
                  id="register-confirm-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={confirmPin}
                  onChange={handlePinChange(setConfirmPin)}
                  placeholder="••••"
                  required
                  className="h-12 text-base tracking-[0.35em]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-rifle">Rifle</Label>
                <Input
                  id="register-rifle"
                  value={rifle}
                  onChange={(event) => setRifle(event.target.value)}
                  placeholder="Optional"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-pistol">Pistol</Label>
                <Input
                  id="register-pistol"
                  value={pistol}
                  onChange={(event) => setPistol(event.target.value)}
                  placeholder="Optional"
                  className="h-12 text-base"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link className="font-medium text-foreground underline underline-offset-4" to="/login">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
