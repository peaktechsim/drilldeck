import { BarChart3, Crosshair, LogOut, Target, Timer } from "lucide-react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/train", label: "Train", icon: Timer },
  { to: "/drills", label: "Drills", icon: Target },
  { to: "/shooters", label: "Shooters", icon: Crosshair },
  { to: "/analysis", label: "Analysis", icon: BarChart3 },
] as const;

export default function Layout() {
  const { shooter, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!shooter) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-2xl font-semibold tracking-tight">DrillDeck</p>
            <p className="text-sm text-muted-foreground">{shooter.name}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-12 px-4 text-base"
            onClick={handleLogout}
          >
            <LogOut className="size-5" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 pb-28 sm:px-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/98 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2 px-3 py-3 sm:px-6">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-16 flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="mb-1 size-6" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
