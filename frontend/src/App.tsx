import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "@/components/layout";
import { AuthProvider } from "@/context/auth-context";
import { ImmersiveProvider } from "@/context/immersive-context";
import AnalysisPage from "@/pages/analysis";
import DrillsPage from "@/pages/drills";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ShootersPage from "@/pages/shooters";
import TrainPage from "@/pages/train";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ImmersiveProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<Layout />}>
                <Route path="/train" element={<TrainPage />} />
                <Route path="/drills" element={<DrillsPage />} />
                <Route path="/shooters" element={<ShootersPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
              </Route>
              <Route path="/" element={<Navigate to="/train" replace />} />
              <Route path="*" element={<Navigate to="/train" replace />} />
            </Routes>
          </BrowserRouter>
        </ImmersiveProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
