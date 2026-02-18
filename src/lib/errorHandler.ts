import { toast } from "sonner";

/**
 * Classe de erro customizada para a aplicação
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Códigos de erro conhecidos
 */
export const ERROR_CODES = {
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  NETWORK_ERROR: "NETWORK_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

/**
 * Trata erros do Supabase e converte para AppError
 */
export function handleSupabaseError(error: any): AppError {
  if (!error) {
    return new AppError("Erro desconhecido", ERROR_CODES.UNKNOWN);
  }

  // Erro de autenticação
  if (error.message?.includes("JWT") || error.message?.includes("token")) {
    return new AppError(
      "Sessão expirada. Por favor, faça login novamente.",
      ERROR_CODES.UNAUTHORIZED,
      401
    );
  }

  // Erro de permissão
  if (error.code === "PGRST301" || error.message?.includes("permission")) {
    return new AppError(
      "Você não tem permissão para realizar esta ação.",
      ERROR_CODES.FORBIDDEN,
      403
    );
  }

  // Recurso não encontrado
  if (error.code === "PGRST116" || error.message?.includes("not found")) {
    return new AppError(
      "Recurso não encontrado.",
      ERROR_CODES.NOT_FOUND,
      404
    );
  }

  // Rate limit
  if (error.code === "PGRST429" || error.message?.includes("rate limit")) {
    return new AppError(
      "Muitas requisições. Por favor, aguarde um momento.",
      ERROR_CODES.RATE_LIMIT,
      429
    );
  }

  // Erro de validação
  if (error.code === "23505" || error.message?.includes("duplicate")) {
    return new AppError(
      "Este registro já existe.",
      ERROR_CODES.VALIDATION_ERROR,
      400
    );
  }

  // Erro de rede
  if (error.message?.includes("fetch") || error.message?.includes("network")) {
    return new AppError(
      "Erro de conexão. Verifique sua internet.",
      ERROR_CODES.NETWORK_ERROR,
      0
    );
  }

  // Erro genérico
  return new AppError(
    error.message || "Ocorreu um erro inesperado.",
    ERROR_CODES.UNKNOWN,
    error.statusCode
  );
}

/**
 * Exibe erro para o usuário de forma amigável
 */
export function showError(error: unknown, defaultMessage = "Ocorreu um erro") {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = handleSupabaseError(error);
  } else {
    appError = new AppError(defaultMessage, ERROR_CODES.UNKNOWN);
  }

  // Mensagens amigáveis por código
  const friendlyMessages: Record<string, string> = {
    [ERROR_CODES.NOT_FOUND]: "Recurso não encontrado",
    [ERROR_CODES.UNAUTHORIZED]: "Sessão expirada. Faça login novamente.",
    [ERROR_CODES.FORBIDDEN]: "Você não tem permissão para esta ação",
    [ERROR_CODES.VALIDATION_ERROR]: appError.message,
    [ERROR_CODES.RATE_LIMIT]: "Muitas requisições. Aguarde um momento.",
    [ERROR_CODES.NETWORK_ERROR]: "Erro de conexão. Verifique sua internet.",
    [ERROR_CODES.UNKNOWN]: defaultMessage,
  };

  const message = friendlyMessages[appError.code] || appError.message;

  toast.error("Erro", {
    description: message,
    duration: 5000,
  });

  // Log detalhado em desenvolvimento
  if (import.meta.env.DEV) {
    console.error("Error details:", {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      context: appError.context,
      originalError: error,
    });
  }

  return appError;
}

/**
 * Wrapper para funções assíncronas com tratamento de erro automático
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    showError(error, errorMessage);
    return null;
  }
}
