import { lazy, Suspense } from "react";
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
import { PageLoader } from "@/components/LoadingSpinner";
import { SupabaseConfigWarning } from "@/components/SupabaseConfigWarning";
import { QUERY_CONFIG } from "@/lib/constants";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const Growth = lazy(() => import("./pages/Growth"));
const Accounts = lazy(() => import("./pages/Accounts"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const Targets = lazy(() => import("./pages/Targets"));
const Reports = lazy(() => import("./pages/Reports"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Filters = lazy(() => import("./pages/Filters"));
const Queue = lazy(() => import("./pages/Queue"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Whitelist = lazy(() => import("./pages/Whitelist"));
const CommentTemplates = lazy(() => import("./pages/CommentTemplates"));
const Subscription = lazy(() => import("./pages/Subscription"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CONFIG.STALE_TIME,
      gcTime: QUERY_CONFIG.GC_TIME,
      retry: QUERY_CONFIG.RETRY,
      retryDelay: QUERY_CONFIG.RETRY_DELAY,
      refetchOnWindowFocus: QUERY_CONFIG.REFETCH_ON_WINDOW_FOCUS,
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

const App = () => {
  try {
    // Mostrar aviso se Supabase não estiver configurado
    if (!isSupabaseConfigured) {
      return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SupabaseConfigWarning />
        </ThemeProvider>
      );
    }

    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <ActiveAccountProvider>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader message="Carregando..." />}>
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
                    </Suspense>
                  </ErrorBoundary>
                </ActiveAccountProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    // Fallback em caso de erro crítico
    console.error("Erro crítico no App:", error);
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        backgroundColor: "#0a0a12",
        color: "#fff",
        padding: "20px",
        fontFamily: "system-ui, sans-serif"
      }}>
        <div style={{ textAlign: "center", maxWidth: "500px" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Erro ao carregar aplicação</h1>
          <p style={{ marginBottom: "24px", color: "#888" }}>
            Ocorreu um erro ao inicializar a aplicação. Verifique o console do navegador para mais detalhes.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }
};

export default App;
