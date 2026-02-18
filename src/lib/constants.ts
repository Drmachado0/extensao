/**
 * Constantes da aplicação
 * Centraliza valores mágicos e configurações
 */

/**
 * Limites de ações diárias
 */
export const DAILY_LIMITS = {
  FOLLOW: {
    MIN: 0,
    MAX: 1000,
    DEFAULT: 100,
  },
  UNFOLLOW: {
    MIN: 0,
    MAX: 1000,
    DEFAULT: 100,
  },
  LIKE: {
    MIN: 0,
    MAX: 2000,
    DEFAULT: 200,
  },
} as const;

/**
 * Limites de caracteres
 */
export const CHAR_LIMITS = {
  USERNAME: {
    MIN: 1,
    MAX: 30,
  },
  COMMENT: {
    MIN: 1,
    MAX: 2200,
  },
  HASHTAG: {
    MIN: 1,
    MAX: 100,
  },
} as const;

/**
 * Delays padrão (em segundos)
 */
export const DELAYS = {
  MIN: {
    MIN: 5,
    MAX: 300,
    DEFAULT: 25,
  },
  MAX: {
    MIN: 5,
    MAX: 600,
    DEFAULT: 45,
  },
} as const;

/**
 * Configuração de cache do React Query
 */
export const QUERY_CONFIG = {
  STALE_TIME: 1000 * 60 * 2, // 2 minutos
  GC_TIME: 1000 * 60 * 10, // 10 minutos (anteriormente cacheTime)
  RETRY: 2,
  RETRY_DELAY: (attempt: number) => Math.min(1000 * 2 ** attempt, 10000),
  REFETCH_ON_WINDOW_FOCUS: false,
} as const;

/**
 * Configuração de debounce/throttle
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  REALTIME_UPDATE: 2000,
  FORM_VALIDATION: 500,
} as const;

/**
 * Timeouts e delays (em milissegundos)
 */
export const TIMEOUTS = {
  HIGHLIGHT_DURATION: 3000,
  INSERT_NOTIFICATION: 2000,
  STATS_DEBOUNCE: 1000,
  SEARCH_DEBOUNCE: 500,
  TOAST_DURATION: 5000,
  ERROR_TOAST_DURATION: 5000,
  SUCCESS_TOAST_DURATION: 2000,
} as const;

/**
 * Limites de paginação
 */
export const PAGINATION = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 0,
} as const;

/**
 * Limites de exportação
 */
export const EXPORT_LIMITS = {
  MAX_ROWS: 50000,
  CHUNK_SIZES: [100, 250, 500, 1000] as const,
  DEFAULT_CHUNK_SIZE: 500,
} as const;

/**
 * Status do bot
 */
export const BOT_STATUS = {
  RUNNING: "running",
  PAUSED: "paused",
  RATE_LIMITED: "rate_limited",
  OFFLINE: "offline",
  CHALLENGE_REQUIRED: "challenge_required",
} as const;

/**
 * Tipos de ações
 */
export const ACTION_TYPES = {
  FOLLOW: "follow",
  UNFOLLOW: "unfollow",
  LIKE: "like",
  COMMENT: "comment",
  SKIP: "skip",
  BLOCK: "block",
  WATCH_REEL: "watch_reel",
} as const;

/**
 * Status de ações
 */
export const ACTION_STATUS = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  INJECTED: "injected",
} as const;

/**
 * Rotas da aplicação
 */
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  AUTH: "/auth",
  LANDING: "/landing",
  ACTIVITY: "/activity",
  GROWTH: "/growth",
  ACCOUNTS: "/accounts",
  TARGETS: "/targets",
  QUEUE: "/queue",
  FILTERS: "/filters",
  WHITELIST: "/whitelist",
  COMMENT_TEMPLATES: "/comment-templates",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  SUBSCRIPTION: "/subscription",
} as const;

/**
 * Mensagens de erro amigáveis
 */
export const ERROR_MESSAGES = {
  NETWORK: "Erro de conexão. Verifique sua internet.",
  UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  NOT_FOUND: "Recurso não encontrado.",
  RATE_LIMIT: "Muitas requisições. Aguarde um momento.",
  VALIDATION: "Dados inválidos. Verifique os campos.",
  UNKNOWN: "Ocorreu um erro inesperado.",
} as const;

/**
 * Mensagens de sucesso
 */
export const SUCCESS_MESSAGES = {
  SAVED: "Salvo com sucesso!",
  DELETED: "Removido com sucesso!",
  UPDATED: "Atualizado com sucesso!",
  CREATED: "Criado com sucesso!",
} as const;
