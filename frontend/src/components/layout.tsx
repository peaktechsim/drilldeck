import { BarChart3, Crosshair, LogOut, Target, Timer } from "lucide-react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useImmersive } from "@/context/immersive-context";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/train", label: "Train", icon: Timer },
  { to: "/drills", label: "Drills", icon: Target },
  { to: "/shooters", label: "Shooters", icon: Crosshair },
  { to: "/analysis", label: "Analysis", icon: BarChart3 },
] as const;

export default function Layout() {
  const { shooter, logout } = useAuth();
  const { immersive } = useImmersive();
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
      {!immersive ? (
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {shooter.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight text-foreground">DrillDeck</p>
                <p className="truncate text-xs text-muted-foreground sm:hidden">{shooter.name}</p>
              </div>
            </div>

            <nav className="hidden items-center gap-1 sm:flex">
              {tabs.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex h-14 items-center border-b-2 px-3 text-sm transition-colors",
                      isActive
                        ? "border-primary font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm text-muted-foreground">{shooter.name}</span>
              <Button type="button" variant="ghost" className="h-9 px-2.5" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>
      ) : null}

      <main
        className={cn(
          "flex flex-1 flex-col",
          immersive
            ? "min-h-screen"
            : "mx-auto w-full max-w-5xl px-4 py-6 pb-16 sm:px-6 sm:pb-6",
        )}
      >
        <Outlet />
      </main>

      {!immersive ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur-sm sm:hidden">
          <div className="mx-auto grid h-12 max-w-5xl grid-cols-5 px-2">
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}

            <button
              type="button"
              className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
