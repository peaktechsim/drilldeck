import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "@/components/layout";
import { AuthProvider } from "@/context/auth-context";
import DrillsPage from "@/pages/drills";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ShootersPage from "@/pages/shooters";

const queryClient = new QueryClient();

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<Layout />}>
              <Route
                path="/train"
                element={<PlaceholderPage title="Train" description="Session timer and entry flow coming next." />}
              />
              <Route path="/drills" element={<DrillsPage />} />
              <Route path="/shooters" element={<ShootersPage />} />
              <Route
                path="/analysis"
                element={<PlaceholderPage title="Analysis" description="Performance charts and drill insights will appear here." />}
              />
            </Route>
            <Route path="/" element={<Navigate to="/train" replace />} />
            <Route path="*" element={<Navigate to="/train" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
