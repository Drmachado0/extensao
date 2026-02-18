import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  /** Nível de contexto para identificar qual parte do app falhou */
  context?: string;
  /** Fallback customizado (opcional) */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  resetKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      resetKey: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    try {
      logger.error("ErrorBoundary caught error", error, {
        componentStack: errorInfo.componentStack,
        context: this.props.context ?? "unknown",
        errorBoundary: true,
      });
    } catch {
      console.error("ErrorBoundary caught error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      resetKey: prev.resetKey + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, errorInfo, showDetails } = this.state;

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="flex max-w-lg w-full flex-col items-center gap-6 text-center">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight gradient-text">
                Algo deu errado
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ocorreu um erro inesperado
                {this.props.context ? ` em "${this.props.context}"` : ""}.
                Tente recarregar a página ou voltar ao início.
              </p>
            </div>

            {/* Error message summary */}
            {error && (
              <div className="w-full rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left">
                <p className="text-xs font-mono text-destructive/80 break-all">
                  {error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Ir ao início
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                className="gap-1 text-muted-foreground text-xs"
              >
                {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showDetails ? "Ocultar detalhes" : "Ver detalhes técnicos"}
              </Button>
            </div>

            {/* Stack trace (collapsible) */}
            {showDetails && errorInfo && (
              <pre className="w-full max-h-48 overflow-auto rounded-lg bg-secondary/60 border border-border/50 p-3 text-left text-[10px] text-muted-foreground font-mono whitespace-pre-wrap break-all">
                {error?.stack ?? ""}
                {"\n\nComponent Stack:"}
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/** HOC para envolver rotas individuais com ErrorBoundary contextual */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) {
  return function WrappedWithErrorBoundary(props: P) {
    return (
      <ErrorBoundary context={context}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
