import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import InboxPage from "./pages/InboxPage";
import BoardPage from "./pages/BoardPage";
import PlannerPage from "./pages/PlannerPage";
import GoalsPage from "./pages/GoalsPage";
import HabitsPage from "./pages/HabitsPage";
import DailyReviewPage from "./pages/DailyReviewPage";
import WeeklyReviewPage from "./pages/WeeklyReviewPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Загрузка...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <AppLayout />
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Index />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/habits" element={<HabitsPage />} />
              <Route path="/reviews/daily" element={<DailyReviewPage />} />
              <Route path="/reviews/weekly" element={<WeeklyReviewPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
