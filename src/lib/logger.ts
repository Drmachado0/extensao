/**
 * Sistema de logging estruturado
 * Em produção, pode ser integrado com serviços como Sentry, LogRocket, etc.
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  /**
   * Log de erro - sempre exibido
   */
  error(message: string, error?: Error, context?: LogContext) {
    const logData = {
      level: "error" as LogLevel,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      context,
      timestamp: new Date().toISOString(),
    };

    console.error(`[ERROR] ${message}`, logData);

    // Em produção, enviar para serviço de monitoramento
    if (this.isProduction) {
      // TODO: Integrar com Sentry ou similar
      // Sentry.captureException(error, { extra: context });
    }
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext) {
    const logData = {
      level: "warn" as LogLevel,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    console.warn(`[WARN] ${message}`, logData);
  }

  /**
   * Log de informação - apenas em desenvolvimento
   */
  info(message: string, context?: LogContext) {
    if (!this.isDevelopment) return;

    const logData = {
      level: "info" as LogLevel,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    console.info(`[INFO] ${message}`, logData);
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, context?: LogContext) {
    if (!this.isDevelopment) return;

    const logData = {
      level: "debug" as LogLevel,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    console.debug(`[DEBUG] ${message}`, logData);
  }

  /**
   * Log de performance
   */
  performance(label: string, duration: number, context?: LogContext) {
    const logData = {
      level: "info" as LogLevel,
      message: `Performance: ${label}`,
      duration: `${duration}ms`,
      context,
      timestamp: new Date().toISOString(),
    };

    if (duration > 1000) {
      this.warn(`Slow operation: ${label} took ${duration}ms`, context);
    } else if (this.isDevelopment) {
      console.info(`[PERF] ${label}: ${duration}ms`, logData);
    }
  }
}

export const logger = new Logger();

/**
 * Hook para medir performance de operações
 */
export function measurePerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - start;
    logger.performance(label, duration);
  });
}
