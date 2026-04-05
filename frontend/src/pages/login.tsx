import { type ChangeEvent, type FormEvent, useState } from "react";
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

export default function LoginPage() {
  const navigate = useNavigate();
  const { shooter, login } = useAuth();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (shooter) {
    return <Navigate to="/train" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const verifiedShooter = await api.verifyPin({ email: email.trim(), pin });
      login(verifiedShooter);
      navigate("/train", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePinChange(event: ChangeEvent<HTMLInputElement>) {
    setPin(normalizePin(event.target.value));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl">Sign in</CardTitle>
          <CardDescription>Use your email and 4-digit PIN to open DrillDeck.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="shooter@example.com"
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={4}
                pattern="[0-9]{4}"
                value={pin}
                onChange={handlePinChange}
                placeholder="••••"
                required
                className="h-12 text-base tracking-[0.35em]"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link
              className="font-medium text-foreground underline underline-offset-4"
              to="/register"
            >
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
