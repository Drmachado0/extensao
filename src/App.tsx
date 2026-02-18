import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ActiveAccountProvider } from "@/hooks/useActiveAccount";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ActivityLog from "./pages/ActivityLog";
import Growth from "./pages/Growth";
import Accounts from "./pages/Accounts";
import SettingsPage from "./pages/Settings";
import Targets from "./pages/Targets";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Filters from "./pages/Filters";
import Queue from "./pages/Queue";
import LandingPage from "./pages/LandingPage";
import Whitelist from "./pages/Whitelist";
import CommentTemplates from "./pages/CommentTemplates";
import Subscription from "./pages/Subscription";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground/80">Carregando</p>
        <p className="text-xs text-muted-foreground">Verificando autenticação...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ActiveAccountProvider>
              <ErrorBoundary>
                <Routes>
                  <Route path="/auth" element={<AuthRoute />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/activity" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
                  <Route path="/log" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
                  <Route path="/growth" element={<ProtectedRoute><Growth /></ProtectedRoute>} />
                  <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
                  <Route path="/targets" element={<ProtectedRoute><Targets /></ProtectedRoute>} />
                  <Route path="/queue" element={<ProtectedRoute><Queue /></ProtectedRoute>} />
                  <Route path="/filters" element={<ProtectedRoute><Filters /></ProtectedRoute>} />
                  <Route path="/whitelist" element={<ProtectedRoute><Whitelist /></ProtectedRoute>} />
                  <Route path="/comment-templates" element={<ProtectedRoute><CommentTemplates /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </ActiveAccountProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
