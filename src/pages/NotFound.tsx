import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center noise-overlay">
      <div className="mesh-bg" />
      <div className="relative z-10 text-center space-y-6">
        <div className="text-8xl font-bold gradient-text mono">404</div>
        <div className="space-y-2">
          <p className="text-xl font-semibold text-foreground">Página não encontrada</p>
          <p className="text-sm text-muted-foreground">
            O caminho <code className="font-mono text-sm bg-secondary px-2 py-1 rounded">{location.pathname}</code> não existe.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home className="h-4 w-4" /> Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
